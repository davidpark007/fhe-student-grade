import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';

const subjects = [
  { id: 0, name: 'Language', icon: '📚' },
  { id: 1, name: 'Mathematics', icon: '🔢' },
  { id: 2, name: 'Science', icon: '🔬' },
  { id: 3, name: 'History', icon: '📜' },
  { id: 4, name: 'Physical', icon: '⚽' },
];

export function ViewSharedGrade() {
  const { address } = useAccount();
  const { instance } = useZamaInstance();
  const signerPromise = useEthersSigner();
  const [student, setStudent] = useState('');
  const [subject, setSubject] = useState(1);
  const [grade, setGrade] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidStudentAddress = /^0x[a-fA-F0-9]{40}$/.test(student);
  const readArgs = isValidStudentAddress ? ([student as `0x${string}`, subject] as const) : undefined;

  const { data: handle, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getEncryptedGrade',
    args: readArgs,
    query: { enabled: false },
  });

  const onView = async (e: React.FormEvent) => {
    e.preventDefault();
    setGrade(null);
    setError(null);

    if (!instance || !address) {
      setError('Please connect your wallet');
      return;
    }
    if (!student || !isValidStudentAddress) {
      setError('Invalid student address');
      return;
    }

    setBusy(true);
    try {
      const { data } = await refetch();
      if (!data) throw new Error('No grade found or access not granted');
      const signer = await signerPromise;
      if (!signer) throw new Error('Wallet not connected');

      const keypair = instance.generateKeypair();
      const start = Math.floor(Date.now() / 1000).toString();
      const durationDays = '10';
      const eip712 = instance.createEIP712(keypair.publicKey, [CONTRACT_ADDRESS], start, durationDays);
      const signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message,
      );
      const res = await instance.userDecrypt([
        { handle: data, contractAddress: CONTRACT_ADDRESS },
      ], keypair.privateKey, keypair.publicKey, signature.replace('0x',''), [CONTRACT_ADDRESS], address, start, durationDays);
      const v = res[data as string];
      setGrade(String(v));
    } catch (e: any) {
      setError(e?.message || 'Failed to decrypt. You may not have permission.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2>View Shared Grade</h2>
      <p>View grades that have been shared with you by students.</p>

      <form onSubmit={onView} className="form-container">
        <div className="form-group">
          <label className="form-label">Student Wallet Address</label>
          <input
            className="form-input"
            placeholder="0x..."
            value={student}
            onChange={e => setStudent(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Subject</label>
          <div className="subject-grid">
            {subjects.map(s => (
              <div
                key={s.id}
                className={`subject-card ${subject === s.id ? 'selected' : ''}`}
                onClick={() => setSubject(s.id)}
              >
                <div className="subject-icon">{s.icon}</div>
                <div className="subject-name">{s.name}</div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="btn btn-primary"
        >
          {busy ? (
            <>
              <span className="spinner"></span>
              Fetching & Decrypting...
            </>
          ) : (
            '🔍 View Grade'
          )}
        </button>
      </form>

      {handle && (
        <div className="info-box">
          <div className="info-box-label">Encrypted Handle</div>
          <div className="info-box-value">{String(handle).slice(0, 66)}</div>
        </div>
      )}

      {grade && !error && (
        <div className="grade-display">
          <div style={{ marginBottom: '0.5rem', fontSize: '1rem', opacity: 0.9 }}>
            {subjects.find(s => s.id === subject)?.icon} {subjects.find(s => s.id === subject)?.name}
          </div>
          <strong>{grade}</strong>
          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', opacity: 0.9 }}>
            / 100
          </div>
        </div>
      )}

      {error && (
        <div className="message message-error">
          {error}
        </div>
      )}

      <div className="info-box">
        <div className="info-box-label">ℹ️ Note</div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          You can only decrypt grades that have been explicitly shared with your address.
          If decryption fails, the student may not have granted you access yet.
        </p>
      </div>
    </div>
  );
}
