import { useState, useEffect } from 'react';
import '../css/file-modal.scss';

function FileModal(args)
{
  const [loaded, setLoaded] = useState(false);
  const [fileContent, setFileContent] = useState(null);
  const [file, setFile] = useState({});

  const imageTypes = ['jpg', 'png', 'jpeg'];
  const audioTypes = ['mp3', 'wav', 'ogg'];
  const videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'mkv'];

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
    fetch(`${args.ServerURL}/api/file/${file.name}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token'),
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

  if (args.showFileModal) {
    return (
      <div className="file-modal" id="file-modal">
        <div className="file-modal-content">
          <header className='flex justify-between items-center'>
            <h4 className='font-bold'>{loaded ? file.name : 'Grabbing File...'}</h4>

            <button id="close" onClick={() => {
              args.setShowFileModal(false);
              setFileContent(null);
              setLoaded(false);

            }}>&times;</button>
          </header>
          <hr/><br/>
  
          {loaded ? (
            <div className="file-modal-body">
              {imageTypes.some(type => type == file.type)
                ? <img src={URL.createObjectURL(fileContent)} alt={file.name} />
                : videoTypes.some(type => type == file.type)
                ? <video src={URL.createObjectURL(fileContent)} controls></video>
                : audioTypes.some(type => type == file.type)
                ? <audio src={URL.createObjectURL(fileContent)} controls></audio>
                : <p className='whitespace-pre-line'>{fileContent}</p>
              }
            </div>
          ) : (
            <div className="mt-36">
              <div className="spinner"></div>
            </div>
          )}
        </div>
      </div>
    );
  }
}
export default FileModal;