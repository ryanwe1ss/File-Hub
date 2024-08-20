import { useState, useEffect, useRef } from 'react';
import '../css/file-modal.scss';

function FileModal(args)
{
  const [lastOpenedFile, setLastOpenedFile] = useState({});
  const [fileContent, setFileContent] = useState(null);
  const [editText, setEditText] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [file, setFile] = useState({});
  const textFile = useRef(null);

  const videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'mkv'];
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif'];
  const audioTypes = ['mp3', 'wav', 'ogg'];
  
  let currentWidth = 100;

  useEffect(() => {
    if (!args.showFileModal) {
      setEditText(false);
      return;
    }

    const openFile = args.itemsSelected[0];
    if (lastOpenedFile.name == openFile.name) {
      setFileContent(lastOpenedFile.data);
      setLoaded(true);
      return;
    }

    setFile(openFile);
    fetch(`${args.ServerURL}/api/file`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'File-Name': openFile.name,
      },
    })
    .then(response => {
      if (
        imageTypes.some(type => type == openFile.type) ||
        audioTypes.some(type => type == openFile.type) ||
        videoTypes.some(type => type == openFile.type)) {
          return response.blob();

      } else return response.text();
    })
    .then(data => {
      setLoaded(true);
      setFileContent(data);
      setLastOpenedFile({
        cache_date: new Date().getTime(),
        name: openFile.name,
        data: data,
      });
    });

  }, [args.showFileModal]);

  function SaveFileChanges() {
    const body = {
      name: file.name,
      content: textFile.current.value,
    };

    fetch(`${args.ServerURL}/api/save`, {
      method: 'POST',
      credentials: 'include',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    })
    .then(response => response.json())
    .then(() => {
      setEditText(false);
      setFileContent(textFile.current.value);
      setLastOpenedFile({
        cache_date: new Date().getTime(),
        name: file.name,
        data: textFile.current.value,
      });
    });
  }

  function ExpandImageOrVideo(action) {
    currentWidth = action 
      ? (currentWidth + 10 > 100 ? 100 : currentWidth + 10)
      : (currentWidth - 10 < 10 ? 10 : currentWidth - 10);

    document.querySelector('img, video').style.width = `${currentWidth}%`;
  }

  if (args.showFileModal) {
    return (
      <div className='file-modal' id='file-modal'>
        <div className='file-modal-content'>
          <header className='flex justify-between'>
            <div className='flex'>
              <h4 className='font-bold'>{loaded ? file.name : 'Grabbing File...'}</h4>
              {imageTypes.some(type => type == file.type) || videoTypes.some(type => type == file.type) ? (
                  <>
                    <button onClick={() => ExpandImageOrVideo(true)} className='text-green-500 mb-2 ml-3'><i className='bi bi-plus-circle'></i></button>
                    <button onClick={() => ExpandImageOrVideo(false)} className='text-red-500 mb-2 ml-2'><i className='bi bi-dash-circle'></i></button>
                  </>
                ) : file.type == 'txt' ? (
                  !editText && (
                    <button onClick={() => setEditText(!editText)} className='text-blue-500 mb-2 ml-3'><i className='text-l bi bi-pencil'></i></button>
                  ) || (
                    <>
                      <button onClick={() => SaveFileChanges()} className='text-green-500 mb-2 ml-3'><i className='text-l bi bi-save'></i></button>
                      <button onClick={() => setEditText(!editText)} className='text-red-500 mb-2 ml-3'><i className='text-l bi bi-x'></i></button>
                    </>
                  )
                  
                ) : null
              }
            </div>

            <button id='close' onClick={() => {
              args.setShowFileModal(false);
              setFileContent(null);
              setLoaded(false);

            }}>&times;</button>
          </header>
          <hr/><br/>
  
          {loaded ? (
            <div className='file-modal-body'>
              {imageTypes.some(type => type == file.type)
                ? <img src={URL.createObjectURL(fileContent)} alt={file.name} />
                : videoTypes.some(type => type == file.type)
                ? <video src={URL.createObjectURL(fileContent)} controls></video>
                : audioTypes.some(type => type == file.type)
                ? <audio src={URL.createObjectURL(fileContent)} controls></audio>
                : <p className='whitespace-pre-line'>
                    {editText ? (
                      <textarea className='border-2 border-black w-full h-64 p-1' defaultValue={fileContent} ref={textFile}></textarea>
                    ) : fileContent
                  }
                  </p>
              }
            </div>
          ) : (
            <div className='mt-36'>
              <div className='spinner'></div>
            </div>
          )}
        </div>
      </div>
    );
  }
}
export default FileModal;