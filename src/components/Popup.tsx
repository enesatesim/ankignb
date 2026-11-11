import React from 'react';
import { CoffeeIcon, GithubIcon, InfoIcon, Bug } from 'lucide-react';
const Popup = () => {
  return (
    <div className='popup-container'>
      {/* Header */}
      <div className='popup-header'>
        <h1 className='popup-title'>AnkiGNB</h1>
        <div className='popup-version'>v1.3</div>
      </div>
      {/* Content */}
      <div className='popup-content'>
        {/* Main description */}
        <div className='content-section'>
          <InfoIcon className='icon icon-info' />
          <p className='text-content'>
            The <span className='highlight'>Copy</span> and{' '}
            <span className='highlight'>Download</span> buttons will appear on the footer of a
            Flashcards or Quiz artifact in the Gemini Notebook Studio panel.
          </p>
        </div>
        <div className='divider'></div>
        {/* Links */}
        <div className='links-container'>
          <a
            href='https://www.buymeacoffee.com/lkmss'
            target='_blank'
            rel='noopener noreferrer'
            className='link-button'
            title='Buy the original creator a coffee'
          >
            <CoffeeIcon className='icon' />
            <span>Support</span>
          </a>
          <a
            href='https://github.com/enesatesim/ankignb'
            target='_blank'
            rel='noopener noreferrer'
            className='link-button'
            title='AnkiGNB on GitHub'
          >
            <GithubIcon className='icon' />
            <span>AnkiGNB</span>
          </a>
          <a
            href='https://github.com/maialks'
            target='_blank'
            rel='noopener noreferrer'
            className='link-button'
            title='Original AnkiNLM author on GitHub'
          >
            <GithubIcon className='icon' />
            <span>AnkiNLM</span>
          </a>
          <a
            href='https://forms.gle/GaEgRg9tZ9e2EVco9'
            target='_blank'
            rel='noopener noreferrer'
            className='link-button'
          >
            <Bug className='icon' />
            <span>Report Issue</span>
          </a>
        </div>
      </div>
      {/* Footer */}
      <div className='popup-footer'>
        <p className='footer-text'>by lkmss · fork by enesatesim</p>
      </div>
    </div>
  );
};

export default Popup;
