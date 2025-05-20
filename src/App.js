// ServerURL URL
const ServerURL = `${process.env.PROTOCOL}://${window.location.hostname}${process.env.USE_PORT_IN_URL == 'true' ? `:${process.env.SERVER_PORT}` : ''}`;
const SocketURL = `${process.env.PROTOCOL == 'https' ? 'wss' : 'ws'}://${window.location.hostname}${process.env.USE_PORT_IN_URL == 'true' ? `:${process.env.FILE_LISTENER_PORT}` : ''}/listener-api`;

// Standard Functions
import { useEffect, useState, useRef } from 'react';

// Load Components
import AuthenticationModal from './components/modals/auth-modal';
import TableFunctions from './components/table-functions';
import FileModal from './components/modals/file-modal';
import FileTable from './components/file-table';
import ExportModal from './components/modals/export-modal';

function App()
{
  const limit = 100;

  const [authenticated, setAuthenticated] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

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
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        'lastFileName': lastFileName,
        'limit': limit,
      }),
    })
    .then(response => {
      if (response.status == 401) throw new Error();
      return response.json();
    })
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
export default App;