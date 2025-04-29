import { useState, useEffect } from 'react';

function FileTable(args)
{
  useEffect(() => {
    const handleScroll = () => {
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
        if (args.count > args.files.length) {
          args.FetchFiles();
        }
      }
    };
  
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);

  }, [args.count, args.files]);

  const UploadFiles = (event) => {
    const form = new FormData();
    const request = new XMLHttpRequest();
    const files = event.type == 'drop' ? event.dataTransfer.files : event.target.files;

    for (let file = 0; file < files.length; file++) {
      if (files[file].name.length > 100) {
        alert('File name is too long. Maximum file name length is 100 characters.');
        return;
      }

      if (files[file].size > 100000000) {
        alert('File size is too large. Maximum file size is 100MB.');
        return;
      
      } form.append('files', files[file]);
    }

    request.open('POST', `${args.ServerURL}/api/upload`);
    request.withCredentials = true;

    request.upload.addEventListener('progress', event => {
      const percent = Math.round((event.loaded / event.total) * 100);
      args.loadingBarRef.current.style.width = `${percent}%`;
    });

    request.addEventListener('load', () => {
      args.loadingBarRef.current.style.width = '0%';
    });

    request.send(form);
    args.fileInputRef.current.value = null;
  }

  const SelectFile = (event, f) => {
    const file = {
      id: f.id,
      name: f.name,
      type: f.type,
    };

    event.target.parentElement.classList.toggle('bg-blue-100');
    if (args.itemsSelected.includes(file)) {
      args.setItemsSelected(args.itemsSelected.filter(item => item != file));
    
    } else args.setItemsSelected([...args.itemsSelected, file]);
  }

  const GetStructuredDate = (date) => {
    const d = new Date(date), h = d.getHours() % 12 || 12, ampm = d.getHours() < 12 ? 'AM' : 'PM';
    return (
      `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}, ` +
      `${h}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')} ${ampm}`
    );
  }

  return (
    <div className='mb-16 mt-20 overflow-hidden'>
      <table className='table-auto divide-y divide-gray-200'>
        <thead>
          <tr>
            <th></th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Name</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Type</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Size</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Created</th>
          </tr>
        </thead>
        <tbody className='no-zoneborder'>
          {args.files.length > 0 ? args.files.map((file, index) => (
            <tr className='hover:cursor-pointer' key={index} onClick={(event) => SelectFile(event, file)}>
              <td className='px-6 py-3 whitespace-nowrap text-sm text-gray-500 pointer-events-none'>
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
              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{GetStructuredDate(file.date)}</td>
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