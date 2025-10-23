import { useState } from 'react';
import '../../css/delete-modal.scss';

export default function DeleteFilesModal(args)
{
  const [loading, setLoading] = useState({
    text: 'Delete All',
    enabled: true,
  });

  const handleDeleteAll = () => {
    setLoading({
      text: 'Deleting...',
      enabled: false,
    });

    fetch(`${args.ServerURL}/api/delete-all`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    })
    .then(response => response.json())
    .then(response => {
      switch (response.success)
      {
        case true:
          args.open(false);
          break;

        case false:
          alert(response.message);
          break;
      }
    })
    .finally(() => {
      setLoading({
        text: 'Delete All',
        enabled: true,
      });
    });
  }

  if (args.show) {
    return (
      <div className='delete-modal' id='delete-modal'>
        <div className='delete-modal-content'>
          <header className='flex justify-between'>
            <h2 className='font-bold'>Delete All</h2>

            <button id='close' onClick={() => {
              args.open(false);

            }}>&times;</button>
          </header>
          <hr/><br/>

          <div className='delete-modal-body'>
            <div className='divide-y divide-gray-200'>
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

            <button
              className='bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-3'
              onClick={handleDeleteAll}
              disabled={!loading.enabled}
            >
              {loading.text}
              <i className='bi bi-trash ml-2'></i>
            </button>
          </div>
        </div>
      </div>
    );
  }
}