// ServerURL URL
const ServerURL = `${process.env.PROTOCOL}://${window.location.hostname}${process.env.USE_PORT_IN_URL == 'true' ? `:${process.env.SERVER_PORT}` : ''}`;
const SocketURL = `${process.env.PROTOCOL == 'https' ? 'wss' : 'ws'}://${window.location.hostname}${process.env.USE_PORT_IN_URL == 'true' ? `:${process.env.FILE_LISTENER_PORT}` : ''}/listener-api`;

// Standard Functions
import { useEffect, useState, useRef } from 'react';

// Load Components
import AuthenticationModal from './components/modals/auth-modal';
import SessionTimeoutModal from './components/modals/timeout-modal';
import TableFunctions from './components/table-functions';
import FileModal from './components/modals/file-modal';
import FileTable from './components/file-table';
import ExportModal from './components/modals/export-modal';

export default function App()
{
  const limit = 100;

  const [authenticated, setAuthenticated] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Session Timeout States
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);
  const isSessionModalSetAsClosed = useRef(false);

  const [files, setFiles] = useState([]);
  const [filesLoaded, setFilesLoaded] = useState(false);
  const [lastFileName, setLastFileName] = useState(null);

  const [count, setCount] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const [itemsSelected, setItemsSelected] = useState([]);

  const authModalRef = useRef(null);
  const fileInputRef = useRef(null);
  const loadingBarRef = useRef(null);

  useEffect(() => {
    ConnectWebSocket();
    FetchFiles();
  }, []);

  useEffect(() => {
    document.body.style.overflow = ([showFileModal, showExportModal].includes(true)
      ? 'hidden'
      : 'auto'
    );

  }, [showFileModal, showExportModal]);

  useEffect(() => {
    setInterval(() => {
      const sessionTimeout = sessionStorage.getItem('session_timeout');

      if (sessionTimeout) {
        const timeLeft = Number(sessionTimeout) - Date.now();

        if (timeLeft <= 300000 && timeLeft > 0) {

          if (!isSessionModalSetAsClosed.current && !showTimeoutModal) {
            setShowTimeoutModal(true);
          
          } setSessionTimeLeft(timeLeft);
        }

        if (timeLeft <= 0) {
          sessionStorage.removeItem('session_timeout');
          window.location.reload(true);
        }
      }

    }, 1000);

  }, []);

  const ConnectWebSocket = () => {
    const socket = new WebSocket(SocketURL);
    socket.addEventListener('message', () => FetchFiles(true));
    socket.addEventListener('close', () => setTimeout(() => ConnectWebSocket(), 1000));
  }

  const FetchFiles = (refresh=false) => {
    document.querySelectorAll('tr').forEach(row => row.classList.remove('bg-blue-100'));
    setItemsSelected([]);
    setFilesLoaded(false);

    fetch(`${ServerURL}/api/files`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'lastFileName': lastFileName,
        'limit': limit,
      }),
    })
    .then(response => response.json())
    .then(data => {
      setLastFileName(data.files[data.files.length - 1]?.name || null);
      setAuthenticated(true);

      setTotalSize(data.size_in_bytes);
      setCount(data.count);

      switch (refresh)
      {
        case false:
          setFiles(prevFiles => {
            const newFiles = data.files.map(file => ({
              ...file,
            }));
            return [...prevFiles, ...newFiles];
          
          }); break;

        case true:
          setFiles(data.files.map(file => ({
            ...file,
          
          }))); break;
      }
    })
    .catch(() => {
      setFiles([]);
      setAuthenticated(false);
      sessionStorage.removeItem('session_timeout');
      authModalRef.current.classList.remove('hidden');
    })
    .finally(() => setFilesLoaded(true));
  }

  return (
    <div className='page overflow-hidden'>
      <AuthenticationModal
        ServerURL={ServerURL}
        authModalRef={authModalRef}
        FetchFiles={FetchFiles}
      />

      <SessionTimeoutModal
        ServerURL={ServerURL}
        modalClose={isSessionModalSetAsClosed}
        show={showTimeoutModal}
        setTimeLeft={setSessionTimeLeft}
        close={setShowTimeoutModal}
        timeLeft={sessionTimeLeft}
      />

      <FileModal
        ServerURL={ServerURL}
        itemsSelected={itemsSelected}
        showFileModal={showFileModal}
        setShowFileModal={setShowFileModal}
      />

      <ExportModal
        fileCount={count}
        totalSize={totalSize}
        ServerURL={ServerURL}

        showExportModal={showExportModal}
        setShowExportModal={setShowExportModal}
      />

      <div className={`w-full ${!authenticated ? 'hidden' : null}`}>
        <TableFunctions
          fileCount={count}
          totalSize={totalSize}
          ServerURL={ServerURL}
          timeLeft={sessionTimeLeft}
          loadingBarRef={loadingBarRef}
          fileInputRef={fileInputRef}
          filesLoaded={filesLoaded}
          itemsSelected={itemsSelected}
          authenticated={authenticated}
          FetchFiles={FetchFiles}
          showFileModal={showFileModal}
          showExportModal={showExportModal}
          setShowExportModal={setShowExportModal}
          setShowFileModal={setShowFileModal}
          setItemsSelected={setItemsSelected}
          setShowTimeoutModal={setShowTimeoutModal}
        />

        <FileTable
          files={files}
          count={count}
          ServerURL={ServerURL}
          FetchFiles={FetchFiles}
          showFileModal={showFileModal}
          showExportModal={showExportModal}
          loadingBarRef={loadingBarRef}
          fileInputRef={fileInputRef}
          itemsSelected={itemsSelected}
          setItemsSelected={setItemsSelected}
        />
      </div>
    </div>
  );
}