import fs from "fs/promises";
import path from "path";
import axios from "axios";
import { createHash } from "crypto";
import { fileURLToPath } from "url";
import AdmZip from "adm-zip";
import * as tar from "tar";
import * as openpgp from "openpgp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HWI_VERSION = "3.0.0";
const HWI_BASE_URL = `https://github.com/bitcoin-core/HWI/releases/download/${HWI_VERSION}`;
const BINARY_DIR = path.join(__dirname, "..", "src-tauri", "binaries");
const PUBLIC_KEY_PATH = path.join(__dirname, "resources", "achow-key.asc");
const SHASUM_FILENAME = "SHA256SUMS.txt.asc";

const BINARIES: Record<
  string,
  Array<{ filename: string; targetName: string }>
> = {
  win32: [
    {
      filename: `hwi-${HWI_VERSION}-windows-x86_64.zip`,
      targetName: "hwi-x86_64-pc-windows-msvc.exe",
    },
  ],
  darwin: [
    {
      filename: `hwi-${HWI_VERSION}-mac-arm64.tar.gz`,
      targetName: "hwi-aarch64-apple-darwin",
    },
    {
      filename: `hwi-${HWI_VERSION}-mac-x86_64.tar.gz`,
      targetName: "hwi-x86_64-apple-darwin",
    },
  ],
  linux: [
    {
      filename: `hwi-${HWI_VERSION}-linux-aarch64.tar.gz`,
      targetName: "hwi-aarch64-unknown-linux-gnu",
    },
    {
      filename: `hwi-${HWI_VERSION}-linux-x86_64.tar.gz`,
      targetName: "hwi-x86_64-unknown-linux-gnu",
    },
  ],
};

async function downloadFile(url: string, outputPath: string): Promise<void> {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    await fs.writeFile(outputPath, response.data);
  } catch (error) {
    console.error(`Failed to download ${url}: ${error.message}`);
    throw error;
  }
}

async function verifyShasumSignature(signaturePath: string): Promise<boolean> {
  try {
    const clearsignedMessage = await fs.readFile(signaturePath, "utf8");
    const publicKeyArmored = await fs.readFile(PUBLIC_KEY_PATH, "utf8");
    const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });

    const message = await openpgp.readCleartextMessage({
      cleartextMessage: clearsignedMessage,
    });
    const verificationResult = await openpgp.verify({
      message,
      verificationKeys: publicKey,
    });

    const { verified, keyID } = verificationResult.signatures[0];
    await verified;

    console.log(`Signature verified with key ID: ${keyID.toHex()}`);
    return true;
  } catch (error) {
    console.error(`Signature verification failed: ${error.message}`);
    return false;
  }
}

async function verifyChecksum(
  filePath: string,
  expectedHash: string,
): Promise<boolean> {
  const fileBuffer = await fs.readFile(filePath);
  const calculatedHash = createHash("sha256").update(fileBuffer).digest("hex");

  const isMatch = calculatedHash === expectedHash;
  console.log(
    `Checksum verification for ${path.basename(filePath)}: ${isMatch ? "Matched" : "Mismatched"}`,
  );
  return isMatch;
}

async function extractBinary(
  archivePath: string,
  targetDir: string,
): Promise<string> {
  if (archivePath.endsWith(".zip")) {
    const zip = new AdmZip(archivePath);
    zip.extractAllTo(targetDir, true);
    const files = await fs.readdir(targetDir);
    const exeFile = files.find(
      (file) => file.endsWith(".exe") && !file.includes("qt"),
    );
    return exeFile ? path.join(targetDir, exeFile) : "";
  } else if (archivePath.endsWith(".tar.gz")) {
    await tar.x({ file: archivePath, C: targetDir });
    const files = await fs.readdir(targetDir);
    const hwiBinary = files.find(
      (file) => file.startsWith("hwi") && !file.includes("qt"),
    );
    return hwiBinary ? path.join(targetDir, hwiBinary) : "";
  }
  throw new Error(`Unsupported archive format: ${archivePath}`);
}

async function setPermissions(filePath: string): Promise<void> {
  try {
    await fs.chmod(filePath, 0o755);
    console.log(`Set permissions for ${path.basename(filePath)} to 755`);
  } catch (error) {
    console.error(
      `Failed to set permissions for ${path.basename(filePath)}: ${error.message}`,
    );
    throw error;
  }
}

async function cleanDirectory(dir: string): Promise<void> {
  try {
    const files = await fs.readdir(dir);
    for (const file of files) {
      if (file.startsWith("hwi-")) {
        await fs.unlink(path.join(dir, file));
      }
    }
  } catch (error) {
    console.error(`Failed to clean up HWI files in ${dir}: ${error.message}`);
    throw error;
  }
}

async function cleanupUnnecessaryFiles(dir: string): Promise<void> {
  try {
    const files = await fs.readdir(dir);
    for (const file of files) {
      if (file.includes("-qt")) {
        const filePath = path.join(dir, file);
        await fs.unlink(filePath);
        console.log(`Removed file: ${path.basename(filePath)}`);
      }
    }
  } catch (error) {
    console.error(`Failed to clean up files in ${dir}: ${error.message}`);
    throw error;
  }
}

async function shouldDownloadBinaries(): Promise<boolean> {
  try {
    const files = await fs.readdir(BINARY_DIR);
    const hwiFiles = files.filter((file) => file.startsWith("hwi-"));
    return (
      hwiFiles.length <
      Object.values(BINARIES).reduce(
        (acc, platformBinaries) => acc + platformBinaries.length,
        0,
      )
    );
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.mkdir(BINARY_DIR, { recursive: true });
      return true;
    }
    throw error;
  }
}

async function main() {
  try {
    const isEmpty = await shouldDownloadBinaries();
    if (!isEmpty) {
      console.log(
        "src-tauri/binaries already has all HWI binaries. Skipping download.",
      );
      return;
    }

    console.log(
      "src-tauri/binaries doesn't have all HWI binaries. Downloading...",
    );

    await cleanDirectory(BINARY_DIR);

    const signaturePath = path.join(BINARY_DIR, SHASUM_FILENAME);
    await downloadFile(`${HWI_BASE_URL}/${SHASUM_FILENAME}`, signaturePath);

    const isSignatureValid = await verifyShasumSignature(signaturePath);
    if (!isSignatureValid) {
      throw new Error("Signature verification failed. Aborting.");
    }

    const shasumContent = await fs.readFile(signaturePath, "utf8");
    const shaLines = shasumContent
      .split("\n")
      .filter((line) => line.trim() !== "" && !line.startsWith("-----"));

    for (const binaryInfoList of Object.values(BINARIES)) {
      for (const { filename, targetName } of binaryInfoList) {
        const downloadUrl = `${HWI_BASE_URL}/${filename}`;
        console.log(`Downloading ${downloadUrl}`);
        const outputPath = path.join(BINARY_DIR, filename);

        await downloadFile(downloadUrl, outputPath);

        const archiveHashLine = shaLines.find((line) =>
          line.includes(filename),
        );
        if (!archiveHashLine) {
          throw new Error(`No hash found for ${filename}`);
        }
        const [archiveExpectedHash] = archiveHashLine.split("  ");

        const isArchiveChecksumValid = await verifyChecksum(
          outputPath,
          archiveExpectedHash,
        );
        if (!isArchiveChecksumValid) {
          throw new Error(
            `Archive checksum verification failed for ${filename}`,
          );
        }

        const extractedPath = await extractBinary(outputPath, BINARY_DIR);
        if (!extractedPath) {
          throw new Error(`Failed to extract binary from ${filename}`);
        }

        const binaryHashLine = shaLines.find((line) =>
          line.includes(`${filename}/${path.basename(extractedPath)}`),
        );
        if (!binaryHashLine) {
          throw new Error(
            `No hash found for extracted binary from ${filename}`,
          );
        }
        const [binaryExpectedHash] = binaryHashLine.split("  ");

        const isBinaryChecksumValid = await verifyChecksum(
          extractedPath,
          binaryExpectedHash,
        );
        if (!isBinaryChecksumValid) {
          throw new Error(
            `Binary checksum verification failed for extracted file from ${filename}`,
          );
        }

        const finalPath = path.join(BINARY_DIR, targetName);
        await fs.rename(extractedPath, finalPath);
        await setPermissions(finalPath);

        await fs.unlink(outputPath);
      }
    }

    await cleanupUnnecessaryFiles(BINARY_DIR);

    await fs.unlink(signaturePath);

    console.log("Final files in BINARY_DIR:");
    console.log(await fs.readdir(BINARY_DIR));
  } catch (error) {
    console.error("An error occurred:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${encodeURI(process.argv[1])}`) {
  main().catch((error) => {
    console.error("An error occurred:", error);
    process.exit(1);
  });
}

export { main as getHwi };
