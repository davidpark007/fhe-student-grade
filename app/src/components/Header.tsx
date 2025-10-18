import { ConnectButton } from '@rainbow-me/rainbowkit';
import '../styles/Header.css';

export function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon">🎓</div>
            <div>
              <h1 className="header-title">
                FHE Student Grades
              </h1>
            </div>
          </div>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
