import { useEffect } from 'react';
import '../css/export-modal.scss';

function ExportModal(args)
{
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
          </div>
        </div>
      </div>
    );
  }
}
export default ExportModal;