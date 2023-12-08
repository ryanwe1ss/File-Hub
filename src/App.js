// ServerURL URL
const ServerURL = `${process.env.PROTOCOL}://${window.location.hostname}${process.env.USE_PORT_IN_URL == 'true' ? `:${process.env.PORT}` : ''}`;

// Standard Functions
import { useEffect, useState, useRef } from 'react';

// Load Components
import AuthenticationModal from './components/auth-modal';
import TableFunctions from './components/table-functions';
import FileModal from './components/file-modal';
import FileTable from './components/file-table';

function App()
{
  useEffect(() => FetchFiles(), []);
  const [authenticated, setAuthenticated] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);

  const [files, setFiles] = useState([]);
  const [filesLoaded, setFilesLoaded] = useState(false);

  const [count, setCount] = useState(0);
  const [itemsSelected, setItemsSelected] = useState(0);

  const authModalRef = useRef(null);
  const fileInputRef = useRef(null);
  const loadingBarRef = useRef(null);
  const checkAllRef = useRef(null);
  const reloadRef = useRef(null);
  const searchRef = useRef(null);
  const limitRef = useRef(null);

  function FetchFiles() {
    const searchQuery = searchRef.current.value;
    const limit = limitRef.current.value;

    setFilesLoaded(false);
    fetch(`${ServerURL}/api/files?name=${searchQuery}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('authorization'),
      },
    })
    .then(response => {
      if (response.status == 401) throw new Error();
      return response.json();
    })
    .then(result => {
      setCount(searchQuery ? result.files.length : result.count);
      setAuthenticated(true);
      setFiles(result.files);
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
      <AuthenticationModal ServerURL={ServerURL} authModalRef={authModalRef} reloadRef={reloadRef}/>
      <FileModal ServerURL={ServerURL} showFileModal={showFileModal} setShowFileModal={setShowFileModal} />

      <div className='w-full'>
        <TableFunctions
          count={count}
          ServerURL={ServerURL}
          loadingBarRef={loadingBarRef}
          fileInputRef={fileInputRef}
          filesLoaded={filesLoaded}
          itemsSelected={itemsSelected}
          authenticated={authenticated}
          FetchFiles={FetchFiles}
          setShowFileModal={setShowFileModal}
          setItemsSelected={setItemsSelected}
          checkAllRef={checkAllRef}
          searchRef={searchRef}
          reloadRef={reloadRef}
          limitRef={limitRef}
        />

        <FileTable
          files={files}
          ServerURL={ServerURL}
          loadingBarRef={loadingBarRef}
          fileInputRef={fileInputRef}
          checkAllRef={checkAllRef}
          itemsSelected={itemsSelected}
          setItemsSelected={setItemsSelected}
          FetchFiles={FetchFiles}
        />
      </div>
    </div>
  );
}
export default App;