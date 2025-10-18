import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("grades:address", "Prints the StudentGrades address").setAction(async (_args, hre) => {
  const { deployments } = hre;
  const d = await deployments.get("StudentGrades");
  console.log("StudentGrades address:", d.address);
});

task("grades:set", "Teacher sets a student's subject grade")
  .addParam("student", "Student address")
  .addParam("subject", "Subject id: 0..4")
  .addParam("value", "Grade value as integer")
  .addOptionalParam("address", "Optionally specify contract address")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, deployments, fhevm } = hre;

    const subject = parseInt(args.subject);
    const value = parseInt(args.value);
    if (!Number.isInteger(subject) || subject < 0 || subject > 4) throw new Error("Invalid subject");
    if (!Number.isInteger(value)) throw new Error("Invalid value");

    await fhevm.initializeCLIApi();
    const d = args.address ? { address: args.address } : await deployments.get("StudentGrades");
    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("StudentGrades", d.address);

    const encrypted = await fhevm.createEncryptedInput(d.address, signer.address).add32(value).encrypt();
    const tx = await contract.connect(signer).setGrade(args.student, subject, encrypted.handles[0], encrypted.inputProof);
    console.log(`Wait for tx: ${tx.hash}...`);
    await tx.wait();
    console.log("Done.");
  });

task("grades:get", "Get encrypted grade handle")
  .addParam("student", "Student address")
  .addParam("subject", "Subject id: 0..4")
  .addOptionalParam("address", "Optionally specify contract address")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, deployments } = hre;
    const subject = parseInt(args.subject);
    if (!Number.isInteger(subject) || subject < 0 || subject > 4) throw new Error("Invalid subject");
    const d = args.address ? { address: args.address } : await deployments.get("StudentGrades");
    const contract = await ethers.getContractAt("StudentGrades", d.address);
    const enc = await contract.getEncryptedGrade(args.student, subject);
    console.log("Encrypted handle:", enc);
  });

task("grades:decrypt", "Decrypt a student's subject grade as current signer")
  .addParam("student", "Student address")
  .addParam("subject", "Subject id: 0..4")
  .addOptionalParam("address", "Optionally specify contract address")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, deployments, fhevm } = hre;
    const subject = parseInt(args.subject);
    if (!Number.isInteger(subject) || subject < 0 || subject > 4) throw new Error("Invalid subject");

    await fhevm.initializeCLIApi();
    const d = args.address ? { address: args.address } : await deployments.get("StudentGrades");
    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("StudentGrades", d.address);
    const enc = await contract.getEncryptedGrade(args.student, subject);

    if (enc === ethers.ZeroHash) {
      console.log("Not set");
      return;
    }
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, enc, d.address, signer);
    console.log("Decrypted grade:", clear);
  });

task("grades:allow", "Student allows a viewer to read a subject grade")
  .addParam("subject", "Subject id: 0..4")
  .addParam("viewer", "Viewer address")
  .addOptionalParam("address", "Optionally specify contract address")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, deployments } = hre;
    const subject = parseInt(args.subject);
    if (!Number.isInteger(subject) || subject < 0 || subject > 4) throw new Error("Invalid subject");
    const d = args.address ? { address: args.address } : await deployments.get("StudentGrades");
    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("StudentGrades", d.address);
    const tx = await contract.connect(signer).allowViewer(subject, args.viewer);
    console.log(`Wait for tx: ${tx.hash}...`);
    await tx.wait();
    console.log("Done.");
  });

