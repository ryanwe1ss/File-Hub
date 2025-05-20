import { useRef } from 'react';
import '../../css/export-modal.scss';

function ExportModal(args)
{
  const loadingBarRef = useRef(null);

  const handleExport = async () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const serverUrl = args.ServerURL;

    loadingBarRef.current.style.width = '0%';

    if (isMobile) {
      let percent = 0;
      const interval = setInterval(() => {
        percent += Math.random() * 7 + 3; // smooth random increment
        if (percent >= 95) {
          clearInterval(interval);
        } else {
          loadingBarRef.current.style.width = `${percent}%`;
        }
      }, 200);

      // Trigger native browser download
      window.location.href = `${args.ServerURL}/api/export-direct`;

      // After some delay, complete progress bar
      setTimeout(() => {
        clearInterval(interval);
        loadingBarRef.current.style.width = '100%';
        setTimeout(() => {
          loadingBarRef.current.style.width = '0%';
        }, 1000);
      }, 15000); // adjust based on expected file size & speed
    }

    else {
      const response = await fetch(`${serverUrl}/api/export`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok || !response.body) {
        alert('Failed to download the file.');
        return;
      }
      
      const reader = response.body.getReader();
      const chunks = [];
      let loaded = 0;
      
      const contentLengthHeader = response.headers.get('Content-Length');
      const total = contentLengthHeader ? parseInt(contentLengthHeader, 10) : null;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
      
        chunks.push(value);
        loaded += value.length;
      
        if (total) {
          const percent = Math.round((loaded / total) * 100);
          loadingBarRef.current.style.width = `${percent}%`;
        } else {
          // If total size unknown, maybe show indeterminate progress or partial progress
          // For example: increase progress slowly up to 90% max
          const percent = Math.min(loaded / (1024 * 1024) / 10, 90); // arbitrary slow grow
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
    }
  };

  if (args.showExportModal) {
    return (
      <div className='export-modal' id='export-modal'>
        <div className='export-modal-content'>
          <header className='flex justify-between'>
            <h2 className='font-bold'>Export All Files</h2>

            <button id='close' onClick={() => {
              args.setShowExportModal(false);

            }}>&times;</button>
          </header>
          <hr/><br/>

          <div className='export-modal-body'>
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
                onClick={handleExport}
              >
                Export
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