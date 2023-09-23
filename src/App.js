// ServerURL URL
const ServerURL = `${process.env.PROTOCOL}://${window.location.hostname}${process.env.USE_PORT_IN_URL === 'true' ? `:${process.env.PORT}` : ''}`;

// Standard Functions
import { useEffect, useState } from "react";

// Load Components
import AuthenticationModal from "./components/auth-modal";
import FileModal from "./components/file-modal";
import FileTable from "./components/file-table";
import DropZone from "./components/drop-zone";
import TableFunctions from "./components/table-functions";

function App()
{
  useEffect(() => FetchFiles(), []);
  const [count, setCount] = useState(0);
  const [authenticated, setAuthenticated] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);

  const [files, setFiles] = useState([]);
  const [itemsSelected, setItemsSelected] = useState(0);

  const FileDrop = () => {
    const dropzone = document.querySelector(".dropzone");

    ["dragenter", "dragover", "dragleave", "drop"].forEach(evtName => {
        dropzone.addEventListener(evtName, (e) => e.preventDefault());
    });

    ["dragenter", "dragover"].forEach(evtName => {
        dropzone.addEventListener(evtName, () => dropzone.classList.add("zoneborder"));
    });

    ["dragleave", "drop"].forEach(evtName => {
        dropzone.addEventListener(evtName, () => dropzone.classList.remove("zoneborder"));
    });

    dropzone.addEventListener("drop", UploadFiles);
  }

  function FetchFiles() {
    const searchQuery = document.getElementById('search').value;
    const limit = document.getElementById('limit').value;

    const previousTbody = document.querySelector('tbody');
    const tempTbody = document.createElement('tbody');
    const loadingRow = document.createElement('tr');

    loadingRow.innerHTML = (`
      <td colspan="6">
        <div class="spinner"></div>
      </td>
    `);
    
    tempTbody.appendChild(loadingRow);
    previousTbody.parentNode.replaceChild(tempTbody, previousTbody);

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
      if (tempTbody.parentNode) tempTbody.parentNode.replaceChild(previousTbody, tempTbody);

      setCount(searchQuery ? result.files.length : result.count);
      setAuthenticated(true);
      setFiles(result.files);
    })
    .catch(() => {
      if (tempTbody.parentNode) tempTbody.parentNode.replaceChild(previousTbody, tempTbody);

      setFiles([]);
      setAuthenticated(false);
      document.getElementById('modal').classList.remove('hidden');
    });
  }

  function UploadFiles(event) {
    const form = new FormData();
    const request = new XMLHttpRequest();
    const files = event.type == 'drop' ? event.dataTransfer.files : event.target.files;

    for (let file = 0; file < files.length; file++) {
      form.append('files', files[file]);
    }

    request.open('POST', `${ServerURL}/api/upload`);
    request.setRequestHeader('Authorization', localStorage.getItem('token'));

    request.upload.addEventListener('progress', event => {
      const percent = Math.round((event.loaded / event.total) * 100);
      document.querySelector('.upload').style.width = `${percent}%`;
    });

    request.addEventListener('load', () => {
      setTimeout(() => FetchFiles(), 100);
      setItemsSelected(0);

      document.getElementById('checkbox-all').checked = false;
    });

    request.send(form);
  }

  return (
    <div className='page overflow-hidden'>
      <AuthenticationModal ServerURL={ServerURL} />
      <FileModal showFileModal={showFileModal} setShowFileModal={setShowFileModal} />

      <div className="w-full">
        <TableFunctions
          count={count}
          ServerURL={ServerURL}
          itemsSelected={itemsSelected}
          authenticated={authenticated}
          FetchFiles={FetchFiles}
          setShowFileModal={setShowFileModal}
          setItemsSelected={setItemsSelected}
        />

        <FileTable
          files={files}
          ServerURL={ServerURL}
          itemsSelected={itemsSelected}
          setItemsSelected={setItemsSelected}
        />
      </div>

      <DropZone FileDrop={FileDrop} UploadFiles={UploadFiles} itemsSelected={itemsSelected} />
    </div>
  );
}
export default App;