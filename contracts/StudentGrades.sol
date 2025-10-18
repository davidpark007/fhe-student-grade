// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Encrypted Student Grades
/// @notice Stores student grades for 5 subjects using FHE. Only the teacher (owner) can set grades.
///         Students can allow per-subject viewers to decrypt their grade client-side via the relayer.
contract StudentGrades is SepoliaConfig {
    address public owner;

    /// @notice Subjects
    /// 0: Language, 1: Mathematics, 2: Science, 3: History, 4: Physical
    uint8 public constant SUBJECT_LANGUAGE = 0;
    uint8 public constant SUBJECT_MATHEMATICS = 1;
    uint8 public constant SUBJECT_SCIENCE = 2;
    uint8 public constant SUBJECT_HISTORY = 3;
    uint8 public constant SUBJECT_PHYSICAL = 4;

    /// @dev student => subject => encrypted grade
    mapping(address => mapping(uint8 => euint32)) private grades;

    event GradeSet(address indexed student, uint8 indexed subject);
    event ViewerAllowed(address indexed student, uint8 indexed subject, address indexed viewer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Set an encrypted grade for a student/subject. Only owner (teacher) can call.
    /// @param student Student address
    /// @param subject Subject id in [0..4]
    /// @param inputEuint32 Encrypted grade input handle
    /// @param inputProof Zama input proof
    function setGrade(
        address student,
        uint8 subject,
        externalEuint32 inputEuint32,
        bytes calldata inputProof
    ) external onlyOwner {
        require(subject <= SUBJECT_PHYSICAL, "Invalid subject");

        euint32 enc = FHE.fromExternal(inputEuint32, inputProof);
        grades[student][subject] = enc;

        // Allow contract, teacher (owner) and the student to access the ciphertext
        FHE.allowThis(enc);
        FHE.allow(enc, owner);
        FHE.allow(enc, student);

        emit GradeSet(student, subject);
    }

    /// @notice Returns the encrypted grade handle for a given student/subject.
    /// @dev View MUST NOT use msg.sender; caller must pass the student address explicitly.
    function getEncryptedGrade(address student, uint8 subject) external view returns (euint32) {
        require(subject <= SUBJECT_PHYSICAL, "Invalid subject");
        return grades[student][subject];
    }

    /// @notice Student allows a viewer to decrypt a specific subject grade.
    /// @param subject Subject id in [0..4]
    /// @param viewer Address to allow
    function allowViewer(uint8 subject, address viewer) external {
        require(subject <= SUBJECT_PHYSICAL, "Invalid subject");
        euint32 enc = grades[msg.sender][subject];
        require(euint32.unwrap(enc) != bytes32(0), "Grade not set");
        FHE.allow(enc, viewer);
        emit ViewerAllowed(msg.sender, subject, viewer);
    }
}
