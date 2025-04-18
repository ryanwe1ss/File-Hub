// ServerURL URL
const ServerURL = `${process.env.PROTOCOL}://${window.location.hostname}${process.env.USE_PORT_IN_URL == 'true' ? `:${process.env.SERVER_PORT}` : ''}`;
const SocketURL = `${process.env.PROTOCOL == 'https' ? 'wss' : 'ws'}://${window.location.hostname}${process.env.USE_PORT_IN_URL == 'true' ? `:${process.env.FILE_LISTENER_PORT}` : ''}/listener-api`;

// Standard Functions
import { useEffect, useState, useRef } from 'react';

// Load Components
import AuthenticationModal from './components/auth-modal';
import TableFunctions from './components/table-functions';
import FileModal from './components/file-modal';
import FileTable from './components/file-table';

function App()
{
  useEffect(() => {
    ConnectWebSocket();
    FetchFiles();
  }, []);

  const limits = [10, 20, 50, 100];

  const [authenticated, setAuthenticated] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);

  const [files, setFiles] = useState([]);
  const [filesLoaded, setFilesLoaded] = useState(false);

  const [count, setCount] = useState(0);
  const [itemsSelected, setItemsSelected] = useState([]);

  const authModalRef = useRef(null);
  const fileInputRef = useRef(null);
  const loadingBarRef = useRef(null);
  const searchRef = useRef(null);
  const limitRef = useRef(null);

  function ConnectWebSocket() {
    const socket = new WebSocket(SocketURL);
    socket.addEventListener('message', () => FetchFiles());
    socket.addEventListener('close', () => setTimeout(() => ConnectWebSocket(), 1000));
  }

  function FetchFiles() {
    const searchQuery = searchRef.current.value;

    document.querySelectorAll('tr').forEach(row => row.classList.remove('bg-blue-100'));
    setItemsSelected([]);
    setFilesLoaded(false);

    fetch(`${ServerURL}/api/files`, {
      method: 'POST',
      credentials: 'include',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        'name': searchQuery,
        'limit': limitRef.current.value,
      }),
    })
    .then(response => {
      if (response.status == 401) throw new Error();
      return response.json();
    })
    .then(data => {
      setAuthenticated(true);
      setCount(data.count);
      setFiles(data.files);
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

      <div className='w-full'>
        <TableFunctions
          count={count}
          limits={limits}
          ServerURL={ServerURL}
          loadingBarRef={loadingBarRef}
          fileInputRef={fileInputRef}
          filesLoaded={filesLoaded}
          itemsSelected={itemsSelected}
          authenticated={authenticated}
          FetchFiles={FetchFiles}
          setShowFileModal={setShowFileModal}
          setItemsSelected={setItemsSelected}
          searchRef={searchRef}
          limitRef={limitRef}
        />

        <FileTable
          files={files}
          ServerURL={ServerURL}
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