import { useRef, useState } from 'react';
import '../../css/export-modal.scss';

function ExportModal(args)
{
  // maximum mobile file size for fancy downloading - measured in megabytes
  const maxMobileDownloadSize = 200;

  const loadingBarRef = useRef(null);
  const [action, setAction] = useState({
    disabled: false,
    text: 'Export',
  });

  const handleExport = async () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const serverUrl = args.ServerURL;

    loadingBarRef.current.style.width = '0%';
    setAction({
      ...action,
      disabled: true,
    });

    if (isMobile) {
      if (args.totalSize > (maxMobileDownloadSize * 1024 * 1024)) {
        window.location.href = `${args.ServerURL}/api/export-direct`;
        args.setShowExportModal(false);

        setTimeout(() => {
          alert(`Total download size is over 200MB (Currently: ${(args.totalSize / (1024 * 1024)).toFixed(2) + 'MB'}). Running in the background.`);
          setAction({
            ...action,
            disabled: false,
          });

        }, 1500); return;
      }
    }

    const response = await fetch(`${serverUrl}/api/export`, {
      method: 'POST',
      credentials: 'include',
    });
    
    if (!response.ok || !response.body) {
      alert('Failed to receive. Refresh your page and try again.');
      return;
    }
    
    const totalSize = response.headers.get('X-Total-Size');
    const reader = response.body.getReader();
    const chunks = [];
    let loaded = 0;
    
    while (true) {
      let done, value;

      try {
        ({ done, value } = await Promise.race([
          reader.read(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Server failed receiving anymore data. Refresh your page and try again.')), 5000)
          )
        ]));
      
      } catch (error) {
        return alert(error.message);
      }

      if (done) break;

      chunks.push(value);
      loaded += value.length;
    
      if (totalSize) {
        const percent = Math.min((loaded / totalSize) * 100, 100);
        loadingBarRef.current.style.width = `${percent}%`;
      }
    }
    
    loadingBarRef.current.style.width = '100%';
    setTimeout(() => {
      loadingBarRef.current.style.width = '0%';
      
    }, 1000);
    
    const blob = new Blob(chunks, { type: 'application/zip' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'export.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    setAction({
      ...action,
      disabled: false,
    });
  };

  if (args.showExportModal) {
    return (
      <div className='export-modal' id='export-modal'>
        <div className='export-modal-content'>
          <header className='flex justify-between'>
            <h2 className='font-bold'>Export All Files</h2>

            <button
              className='mt-[-10px] text-black float-right text-2xl font-bold hover:text-red-500 hover:cursor-pointer'
              onClick={() => args.setShowExportModal(false)}
              disabled={action.disabled}
            >
              &times;
            </button>
          </header>
          <hr/><br/>

          <div className='break-all'>
            <table className='table-auto divide-y divide-gray-200'>
              <thead>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'># of Files</th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Total Size</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{args.fileCount}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    {args.totalSize > 1000000 ?
                      (args.totalSize / 1000000).toFixed(2) + ' MB' :
                      (args.totalSize / 1000).toFixed(2) + ' KB'}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className='flex items-center gap-4 w-full mt-4'>
              <button
                className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
                disabled={action.disabled}
                onClick={handleExport}
              >
                {action.text}
                <i className='bi bi-download ml-2'></i>
              </button>

              <div className='flex-1 h-10 bg-gray-200 rounded-lg overflow-hidden'>
                <div className='h-full bg-green-500' style={{ width: '0%' }} ref={loadingBarRef}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default ExportModal;