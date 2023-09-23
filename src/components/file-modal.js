import { useEffect } from 'react';
import '../css/file-modal.scss';

function FileModal(args)
{
  useEffect(() => {
    if (!args.showFileModal) return;

    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    let file = {};

    for (let index = 1; index < checkboxes.length; index++) {
      if (checkboxes[index].checked) {
        file = {
          name: checkboxes[index].parentNode.parentNode.childNodes[2].innerHTML,
          type: checkboxes[index].parentNode.parentNode.childNodes[3].innerHTML,
          size: checkboxes[index].parentNode.parentNode.childNodes[4].innerHTML,
          date: checkboxes[index].parentNode.parentNode.childNodes[5].innerHTML,
        
        }; break;
      }
    }

    console.log(file);

  }, [args.showFileModal]);

  if (args.showFileModal) {
    return (
      <div className="file-modal" id="file-modal">
        <div className="file-modal-content">
          <header className='flex justify-between items-center'>
            <h4 className='font-bold'>Showing File</h4>

            <button id="close" onClick={() => args.setShowFileModal(false)}>&times;</button>
          </header>
          <hr/><br/>
  
          <div className="file-modal-body">
            hello
          </div>
        </div>
      </div>
    );
  }
}
export default FileModal;