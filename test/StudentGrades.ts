import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

import { StudentGrades__factory, StudentGrades } from "../types";

type Signers = {
  teacher: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("StudentGrades")) as StudentGrades__factory;
  const contract = (await factory.deploy()) as StudentGrades;
  const address = await contract.getAddress();
  return { contract, address };
}

describe("StudentGrades", function () {
  let signers: Signers;
  let contract: StudentGrades;
  let address: string;

  before(async function () {
    const [teacher, alice, bob] = await ethers.getSigners();
    signers = { teacher, alice, bob };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn(`This test suite runs only on mock FHEVM`);
      this.skip();
    }
    ({ contract, address } = await deployFixture());
  });

  it("teacher can set and student can decrypt", async function () {
    const subject = 1; // Mathematics
    const grade = 95;

    const enc = await fhevm.createEncryptedInput(address, signers.teacher.address).add32(grade).encrypt();

    await expect(
      contract.connect(signers.teacher).setGrade(signers.alice.address, subject, enc.handles[0], enc.inputProof),
    ).to.emit(contract, "GradeSet");

    const handle = await contract.getEncryptedGrade(signers.alice.address, subject);
    expect(handle).to.not.eq(ethers.ZeroHash);

    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, address, signers.alice);
    expect(clear).to.eq(grade);
  });

  it("viewer cannot decrypt until allowed, then can", async function () {
    const subject = 2; // Science
    const grade = 88;

    const enc = await fhevm.createEncryptedInput(address, signers.teacher.address).add32(grade).encrypt();
    await contract.connect(signers.teacher).setGrade(signers.alice.address, subject, enc.handles[0], enc.inputProof);

    const handle = await contract.getEncryptedGrade(signers.alice.address, subject);

    // Try decrypt as bob before allow - in mock, this should fail or return undefined; we check for throw
    let failed = false;
    try {
      await fhevm.userDecryptEuint(FhevmType.euint32, handle, address, signers.bob);
    } catch {
      failed = true;
    }
    expect(failed).to.eq(true);

    // Alice allows Bob
    await expect(contract.connect(signers.alice).allowViewer(subject, signers.bob.address)).to.emit(
      contract,
      "ViewerAllowed",
    );

    const dec = await fhevm.userDecryptEuint(FhevmType.euint32, handle, address, signers.bob);
    expect(dec).to.eq(grade);
  });
});

