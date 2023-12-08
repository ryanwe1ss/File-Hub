import { useState, useEffect } from 'react';
import '../css/file-modal.scss';

function FileModal(args)
{
  const [fileContent, setFileContent] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [file, setFile] = useState({});

  const imageTypes = ['jpg', 'png', 'jpeg'];
  const audioTypes = ['mp3', 'wav', 'ogg'];
  const videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'mkv'];
  const allowedCharacterTypes = ['txt', 'sql', 'json', 'html', 'csv'];
  
  let currentWidth = 100;

  useEffect(() => {
    if (!args.showFileModal) return;

    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    let file = {};

    for (let index = 1; index < checkboxes.length; index++) {
      if (checkboxes[index].checked) {
        file = {
          name: checkboxes[index].parentNode.parentNode.childNodes[2].innerHTML,
          type: checkboxes[index].parentNode.parentNode.childNodes[3].innerHTML.toLowerCase(),
          size: checkboxes[index].parentNode.parentNode.childNodes[4].innerHTML,
          date: checkboxes[index].parentNode.parentNode.childNodes[5].innerHTML,
        
        }; break;
      }
    }

    setFile(file);
    fetch(`${args.ServerURL}/api/file`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('authorization'),
        'File-Name': file.name,
      },
    })
    .then(response => {
      if (
        imageTypes.some(type => type == file.type) ||
        audioTypes.some(type => type == file.type) ||
        videoTypes.some(type => type == file.type)) {
          return response.blob();

      } else return response.text();
    })
    .then(data => {
      setFileContent(data);
      setLoaded(true);
    });

  }, [args.showFileModal]);

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
                    {allowedCharacterTypes.includes(file.type) ? fileContent : 'File cannot be displayed because it is not supported'}
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