import { useRef } from 'react';
import '../../css/export-modal.scss';

function ExportModal(args)
{
  const loadingBarRef = useRef(null);

  const handleExport = () => {
    const request = new XMLHttpRequest();

    request.open('POST', `${args.ServerURL}/api/export`);
    request.setRequestHeader('Content-Type', 'application/json');
    request.withCredentials = true;
    request.responseType = 'blob';

    request.addEventListener('progress', (event) => {
      const percent = Math.round((event.loaded / event.total) * 100);
      loadingBarRef.current.style.width = `${percent}%`;
    });
    
    request.addEventListener('load', () => {
      const instance = document.createElement('a');

      instance.href = window.URL.createObjectURL(request.response);
      instance.download = 'export.zip';
      instance.click();

      loadingBarRef.current.style.width = '0%';
    });

    request.send();
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