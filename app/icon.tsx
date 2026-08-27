import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  const logo = await readFile(new URL("../public/logo.png", import.meta.url));
  const logoSource = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    <div style={{ display: "flex", height: "100%", overflow: "hidden", width: "100%" }}>
      {/* ImageResponse needs a native image element to crop the logo mark. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="JobPilot" src={logoSource} style={{ height: "100%", width: "189px" }} />
    </div>,
    size,
  );
}
