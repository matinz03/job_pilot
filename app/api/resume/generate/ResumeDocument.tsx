import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import type { ResumeContent, ResumeRole } from "@/lib/resume-generation";

// A PDF is rendered outside the browser, so it cannot read the CSS variables in ui-tokens.md.
// These are the same values, named after the tokens they mirror, so the document stays in step
// with the rest of the product.
const palette = {
  textPrimary: "#101828",
  textSecondary: "#6a7282",
  textDark: "#364153",
  accent: "#7c5cfc",
};

// Only the CSS properties listed in library-docs.md are supported — anything else is ignored
// silently by @react-pdf/renderer.
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: palette.textPrimary, lineHeight: 1.4 },
  name: { fontSize: 20, fontWeight: "bold" },
  headline: { fontSize: 11, color: palette.accent, marginTop: 2 },
  contact: { fontSize: 9, color: palette.textSecondary, marginTop: 4 },
  section: { marginTop: 16 },
  sectionHeading: { fontSize: 10, fontWeight: "bold", color: palette.accent, marginBottom: 6 },
  summary: { color: palette.textDark },
  role: { marginBottom: 10 },
  roleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  roleTitle: { fontSize: 11, fontWeight: "bold" },
  roleCompany: { fontSize: 10, color: palette.textDark },
  rolePeriod: { fontSize: 9, color: palette.textSecondary },
  bullet: { flexDirection: "row", marginTop: 3 },
  bulletMark: { width: 10, color: palette.accent },
  bulletText: { width: 505, color: palette.textDark },
  educationLine: { color: palette.textDark },
  skills: { color: palette.textDark },
});

function period(role: ResumeRole): string {
  const end = role.current ? "Present" : role.endDate;
  return [role.startDate, end].filter(Boolean).join(" – ");
}

function Section({ children, heading }: { children: ReactNode; heading: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeading}>{heading.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function ResumeDocument({ content }: { content: ResumeContent }) {
  return (
    <Document title={`${content.fullName} — Resume`}>
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.name}>{content.fullName}</Text>
          {content.headline !== "" && <Text style={styles.headline}>{content.headline}</Text>}
          {content.contactLine !== "" && <Text style={styles.contact}>{content.contactLine}</Text>}
          {content.links.length > 0 && <Text style={styles.contact}>{content.links.join("  •  ")}</Text>}
        </View>

        {content.summary !== "" && (
          <Section heading="Summary">
            <Text style={styles.summary}>{content.summary}</Text>
          </Section>
        )}

        {content.roles.length > 0 && (
          <Section heading="Experience">
            {content.roles.map((role) => (
              <View key={`${role.company}-${role.title}`} style={styles.role}>
                <View style={styles.roleHeader}>
                  <Text style={styles.roleTitle}>{role.title}</Text>
                  <Text style={styles.rolePeriod}>{period(role)}</Text>
                </View>
                <Text style={styles.roleCompany}>{role.company}</Text>
                {role.bullets.map((bullet) => (
                  <View key={bullet} style={styles.bullet}>
                    <Text style={styles.bulletMark}>•</Text>
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ))}
          </Section>
        )}

        {content.education.length > 0 && (
          <Section heading="Education">
            {content.education.map((line) => (
              <Text key={line} style={styles.educationLine}>{line}</Text>
            ))}
          </Section>
        )}

        {content.skills.length > 0 && (
          <Section heading="Skills">
            <Text style={styles.skills}>{content.skills.join("  •  ")}</Text>
          </Section>
        )}
      </Page>
    </Document>
  );
}

export function renderResumePdf(content: ResumeContent): Promise<Buffer> {
  return renderToBuffer(<ResumeDocument content={content} />);
}
