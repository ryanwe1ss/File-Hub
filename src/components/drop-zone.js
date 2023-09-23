function DropZone(args)
{
  return (
    <div className="flex flex-col">
      <div className='dropzone w-1/6 bg-gray-200 flex flex-col justify-center cursor-pointer ml-3' onClick={() => document.getElementById('fileInput').click()} onDragOver={args.FileDrop}>
        <div className='text-center mb-4 text-gray-600'>Drop Files Here</div>
        
        <div className='flex items-center justify-center'>
          <div className='bi bi-arrow-down-circle text-7xl'></div>
        </div>

        <div className="upload-bar mt-auto">
          <div className="upload"></div>
        </div>

        <input
          type='file'
          id='fileInput'
          onChange={args.UploadFiles}
          className='hidden'
        />
      </div>
      
      <div className='flex flex-col items-center mt-2'>
        <button disabled={true} className='bg-orange-500 text-white py-1 px-2 rounded'>{args.itemsSelected} Items Selected</button>
      </div>
    </div>
  );
}
export default DropZone;