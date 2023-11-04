// ServerURL URL
const ServerURL = `${process.env.PROTOCOL}://${window.location.hostname}${process.env.USE_PORT_IN_URL == 'true' ? `:${process.env.PORT}` : ''}`;

// Standard Functions
import { useEffect, useState, useRef } from 'react';

// Load Components
import AuthenticationModal from './components/auth-modal';
import FileModal from './components/file-modal';
import FileTable from './components/file-table';
import DropZone from './components/drop-zone';
import TableFunctions from './components/table-functions';

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
        'Authorization': localStorage.getItem('token'),
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
          checkAllRef={checkAllRef}
          itemsSelected={itemsSelected}
          setItemsSelected={setItemsSelected}
        />
      </div>

      <DropZone
        ServerURL={ServerURL}
        itemsSelected={itemsSelected}
        checkAllRef={checkAllRef}
        FetchFiles={FetchFiles}
        setItemsSelected={setItemsSelected}
      />
    </div>
  );
}
export default App;