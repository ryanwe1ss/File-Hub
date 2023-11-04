import { useRef } from 'react';

function DropZone(args)
{
  const fileInputRef = useRef(null);
  const uploadBarRef = useRef(null);
  const dropZoneRef = useRef(null);

  const FileDrop = () => {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZoneRef.current.addEventListener(eventName, (e) => e.preventDefault());
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZoneRef.current.addEventListener(eventName, () => dropZoneRef.current.classList.add('zoneborder'));
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZoneRef.current.addEventListener(eventName, () => dropZoneRef.current.classList.remove('zoneborder'));
    });

    dropZoneRef.current.addEventListener('drop', UploadFiles);
  }

  function UploadFiles(event) {
    const form = new FormData();
    const request = new XMLHttpRequest();
    const files = event.type == 'drop' ? event.dataTransfer.files : event.target.files;

    for (let file = 0; file < files.length; file++) {
      if (files[file].size > 100000000) {
        alert('File size is too large. Maximum file size is 100MB.');
        return;
      }

      form.append('files', files[file]);
    }

    request.open('POST', `${args.ServerURL}/api/upload`);
    request.setRequestHeader('Authorization', localStorage.getItem('token'));

    request.upload.addEventListener('progress', event => {
      const percent = Math.round((event.loaded / event.total) * 100);
      uploadBarRef.current.style.width = `${percent}%`;
    });

    request.addEventListener('load', () => {
      setTimeout(() => args.FetchFiles(), 100);
      args.setItemsSelected(0);

      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      uploadBarRef.current.style.width = '0%';
      args.checkAllRef.current.checked = false;

      for (let index = 1; index < checkboxes.length; index++) {
        checkboxes[index].checked = false;
      }
    });

    request.send(form);
    fileInputRef.current.value = null;
  }

  return (
    <div className='dropzone flex flex-col'>
      <div
        className='dropzone-body w-1/6 bg-gray-200 flex flex-col justify-center cursor-pointer ml-3'
        onClick={() => fileInputRef.current.click()}
        ref={dropZoneRef}
        onDragOver={FileDrop}
      >
        <div className='text-center mb-4 text-gray-700'>Drop Files Here</div>
        
        <div className='flex items-center justify-center'>
          <div className='bi bi-arrow-down-circle text-7xl'></div>
        </div>

        <div className='upload-bar mt-auto'>
          <div className='upload' ref={uploadBarRef}></div>
        </div>

        <input
          type='file'
          ref={fileInputRef}
          onChange={UploadFiles}
          className='hidden'
          multiple={true}
        />
      </div>
      
      <div className='flex flex-col items-center mt-2'>
        <button disabled={true} className='bg-orange-500 text-white py-1 px-2 rounded'>{args.itemsSelected} Items Selected</button>
      </div>
    </div>
  );
}
export default DropZone;