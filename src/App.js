import '../src/css/desktop.scss';

function App() {
  return (
    <div className="container">
      <header>
        <div className="upload">
          <div className="dropzone">
              <form style={{marginBottom: "10px"}}>
                  <p>Upload multiple files with the file dialog or by dragging and dropping them within the bordered region</p>
                  <input type="file" id="upload" multiple accept="image/*"/>
              </form>

              <div className="progress" style={{border: "1px solid black"}}>
                  <div id="progressBar" className="progress-bar" role="progressbar"/>
              </div>
              <label id="loader"/>
              <div id="fileList"/>
              <br/>
          </div>
        </div>

        <div className="actions">
          <input type="button" value="Download"/>
          <input type="button" value="Delete"/>
        </div>
      </header>
    </div>
  );
}

export default App;