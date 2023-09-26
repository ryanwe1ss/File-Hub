function DropZone(args)
{
  const FileDrop = () => {
    const dropzone = document.querySelector(".dropzone-body");

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

  function UploadFiles(event) {
    const form = new FormData();
    const request = new XMLHttpRequest();
    const files = event.type == 'drop' ? event.dataTransfer.files : event.target.files;

    for (let file = 0; file < files.length; file++) {
      form.append('files', files[file]);
    }

    request.open('POST', `${args.ServerURL}/api/upload`);
    request.setRequestHeader('Authorization', localStorage.getItem('token'));

    request.upload.addEventListener('progress', event => {
      const percent = Math.round((event.loaded / event.total) * 100);
      document.querySelector('.upload').style.width = `${percent}%`;
    });

    request.addEventListener('load', () => {
      setTimeout(() => args.FetchFiles(), 100);
      args.setItemsSelected(0);

      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      document.querySelector('.upload').style.width = '0%';
      document.getElementById('checkbox-all').checked = false;

      for (let index = 1; index < checkboxes.length; index++) {
        checkboxes[index].checked = false;
      }
    });

    request.send(form);
  }

  return (
    <div className="dropzone flex flex-col">
      <div className='dropzone-body w-1/6 bg-gray-200 flex flex-col justify-center cursor-pointer ml-3' onClick={() => document.getElementById('fileInput').click()} onDragOver={FileDrop}>
        <div className='text-center mb-4 text-gray-700'>Drop Files Here</div>
        
        <div className='flex items-center justify-center'>
          <div className='bi bi-arrow-down-circle text-7xl'></div>
        </div>

        <div className="upload-bar mt-auto">
          <div className="upload"></div>
        </div>

        <input
          type='file'
          id='fileInput'
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