import { useState } from 'react';

function FileTable(args)
{
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    UploadFiles(event);
  };

  function UploadFiles(event) {
    const form = new FormData();
    const request = new XMLHttpRequest();
    const files = event.type == 'drop' ? event.dataTransfer.files : event.target.files;

    for (let file = 0; file < files.length; file++) {
      if (files[file].size > 100000000) {
        alert('File size is too large. Maximum file size is 100MB.');
        return;
      
      } form.append('files', files[file]);
    }

    request.open('POST', `${args.ServerURL}/api/upload`);
    request.setRequestHeader('Authorization', localStorage.getItem('authorization'));

    request.upload.addEventListener('progress', event => {
      const percent = Math.round((event.loaded / event.total) * 100);
      args.loadingBarRef.current.style.width = `${percent}%`;
    });

    request.addEventListener('load', () => {
      args.setItemsSelected(0);

      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      args.loadingBarRef.current.style.width = '0%';
      args.checkAllRef.current.checked = false;

      for (let index = 1; index < checkboxes.length; index++) {
        checkboxes[index].checked = false;
      }
    });

    request.send(form);
    args.fileInputRef.current.value = null;
  }

  function CheckAll() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
      checkbox.checked = args.checkAllRef.current.checked;
      if (checkbox.checked) args.setItemsSelected(checkboxes.length - 1);
      else args.setItemsSelected(0);
    });
  }

  function CheckBox(event) {
    if (event.target.checked) args.setItemsSelected(args.itemsSelected + 1);
    else args.setItemsSelected(args.itemsSelected - 1);
  }

  return (
    <div>
      <table className='table-auto divide-y divide-gray-200'>
        <thead>
          <tr>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500'>
              <input type='checkbox' onChange={CheckAll} className='h-5 w-5 text-blue-600' ref={args.checkAllRef}/>
            </th>
            <th></th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Name</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Type</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Size</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Created</th>
          </tr>
        </thead>
        <tbody
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={isDragging ? 'zoneborder' : 'no-zoneborder'}
        >
          {args.files.length > 0 ? args.files.map(file => (
            <tr className='bg-gray-50' key={file.id}>
              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                <input type='checkbox' className='h-5 w-5 text-blue-600' onChange={CheckBox}/>
              </td>
              <td className='whitespace-nowrap text-sm text-gray-500'>
                {file.thumbnail ? <img src={file.thumbnail} alt={file.name} className='w-8 h-8 rounded-md'/>
                  : file.type == 'txt' ? <i className='bi bi-file-text text-2xl'></i>
                  : file.type == 'pdf' ? <i className='bi bi-file-earmark-pdf text-2xl'></i>
                  : file.type == 'doc' || file.type == 'docx' ? <i className='bi bi-file-earmark-word text-2xl'></i>
                  : file.type == 'mkv' || file.type == 'mp4' || file.type == 'avi' || file.type == 'mov' ? <i className='bi bi-file-earmark-play text-2xl'></i>
                  : file.type == 'mp3' || file.type == 'wav' || file.type == 'ogg' || file.type == 'flac' ? <i className='bi bi-file-earmark-music text-2xl'></i>
                  : file.type == 'zip' || file.type == 'rar' || file.type == '7z' ? <i className='bi bi-file-earmark-zip text-2xl'></i>
                  : file.type == 'exe' ? <i className='bi bi-file-earmark-binary text-2xl'></i>
                  : <i className='bi bi-file-earmark-text text-3xl'></i>
                }
              </td>
              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{file.name}</td>
              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase tracking-wider'>{file.type}</td>
              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                {file.size < 1024 ? `${file.size} B`
                  : file.size < 1048576 ? `${(file.size / 1024).toFixed(2)} KB`
                  : file.size < 1073741824 ? `${(file.size / 1048576).toFixed(2)} MB`
                  : `${(file.size / 1073741824).toFixed(2)} GB`
                }
              </td>
              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{new Date(file.date).toLocaleString()}</td>
            </tr>
          )) : (
            <tr className='bg-gray-50'>
              <td className='text-1xl text-center px-6 py-4 text-gray-500' colSpan='6'>No Files Found</td>
            </tr>
          )}
        </tbody>
      </table>

      <input
        type='file'
        ref={args.fileInputRef}
        onChange={UploadFiles}
        className='hidden'
        multiple={true}
      />
    </div>
  );
}
export default FileTable;