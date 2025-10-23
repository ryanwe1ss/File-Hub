import '../../css/failed-upload-modal.scss';

export default function FailedToUploadModal(args)
{
  if (args.failed.open) {
    return (
      <div className='failed-upload-modal' id='failed-upload-modal'>
        <div className='failed-upload-modal-content'>
          <header className='flex justify-between'>
            <h2 className='font-bold'>Files Failed to Upload</h2>

            <button id='close' onClick={() => {
              args.setFailed({ open: false, files: [] });

            }}>&times;</button>
          </header>
          <hr/><br/>

          <div className='failed-upload-modal-body'>
            <div className='divide-y divide-gray-200'>
              {args.failed.files.map((file, index) => (
                <div key={index} className='p-4'>
                  <div className='text-xs font-medium text-gray-500 uppercase mb-1'>File</div>
                  <div className='text-sm text-gray-700 mb-3'>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</div>
                  
                  <div className='text-xs font-medium text-gray-500 uppercase mb-1'>Reason</div>
                    {file.reasons ? (
                      <ul className='list-disc list-inside text-sm text-gray-700 mb-3'>
                        {file.reasons.map((reason, index) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className='text-sm text-gray-700 mb-3'>No reasons provided</div>
                    )}
                  </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
}