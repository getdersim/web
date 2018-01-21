/* eslint-disable */
$(document).ready(() => {
  $('.tabs').tabs()
  $('.sidenav').sidenav({swipeable: true})
  $('.modal').modal();
  $('.uploadModal').modal();
  // $('.materialboxed').materialbox();

  $('.fixed-action-btn').floatingActionButton({
   direction: 'top', // Direction menu comes out
   hoverEnabled: false, // Hover enabled
   toolbarEnabled: false // Toolbar transition enabled
  })

  let doc;

  const userProfile = $('.userProfile')

  $(document).on('click', '.doLogin', function() {
    const provider = $(this).data('provider');
    handleLogin(provider)
  })

  $(document).on('click', '.doLogout', function() {
    handleLogout()
  })

  const config = {
    apiKey: "AIzaSyAnI8whawVkwgJQ73moU4HHiOIehVaofVs",
    authDomain: "getdersim.firebaseapp.com",
    databaseURL: "https://getdersim.firebaseio.com",
    projectId: "getdersim",
    storageBucket: "getdersim.appspot.com",
    messagingSenderId: "28031381946"
  }

  firebase.initializeApp(config)
  const db = firebase.firestore()

  document.getElementById('file').addEventListener('change', handleFileSelect, false);

  function handleFileSelect(evt) {
    var storageRef;
    try {
      var uid = firebase.auth().currentUser.uid;
       storageRef = firebase.storage().ref(`document/${uid}`);
    } catch (e) {
      M.toast({html: `Döküman yayınlamadan önce lütfen giriş yapın.`, classes: 'rounded'});
    }

    var files = evt.target.files;
    window.e = evt;
    // return;

    for (var i = 0, f; f = files[i]; i++) {

      if (!f.type.match('application/pdf')) {
        continue;
      }

      var reader = new FileReader();

      reader.onload = (function(theFile) {
        return function(e) {
          // TODO @cagatay file name can be insert unwanted js. `><img src=/ onerror=alert() />
          M.toast({html: `${theFile.name} yükleniyor...`, classes: 'rounded'});
          let date = new Date();
          date = date.valueOf(); // timestamp
          const file = date;
          date = `${date}.pdf`;
          var pdfDocRef = storageRef.child(date);

          pdfDocRef.putString(e.target.result, 'data_url').then(function(snapshot) {
            console.log('Uploaded a data_url string!');
            M.toast({html: `${theFile.name} başarıyla yüklendi.`, classes: 'rounded'});

            storageRef.child(date).getDownloadURL().then(function(url) {
              doc = {name: date, url, id: file};
              // TODO @cagataycali when user delete things dom have to change.
              // TODO @cagataycali magic happen here. PDF TO GIF.
              M.toast({html: `Döküman başarıyla yüklendi.`, classes: 'rounded'});
              $('.publishDocument').removeClass('disabled');
            })
          })
          .catch(error => {
            console.log(error);
            M.toast({html: `Yeni bir döküman yayınlama yetkiniz yok :)`, classes: 'rounded'});
          })


          const content = `
          <div class="col s12 m4 document-${file}">
            <div class="card">
              <div class="card-image">
                <img src="${e.target.result}">
                <span class="card-title truncate">${escape(theFile.name)}</span>
              </div>
              <div class="card-action">
                <a class="removeSelectedDocument" data-id="${file}">SİL</a>
              </div>
            </div>
          </div>
          `;
          $(content).insertBefore("#uploadedDocument");
        };
      })(f);

      // Read in the image file as a data URL.
      reader.readAsDataURL(f);
    }
  }

  $(document).on('click', '.removeSelectedDocument', function() {
    const id = $(this).data('id');
    var storageRef;
    try {
      var uid = firebase.auth().currentUser.uid;
       storageRef = firebase.storage().ref(`document/${uid}`);
    } catch (e) {
      M.toast({html: `Döküman silmeden önce lütfen giriş yapın.`, classes: 'rounded'});
    }
    $(`.document-${id}`).hide(300);
    var pdfDocRef = storageRef.child(doc.name);

    pdfDocRef.delete().then(function() {
      M.toast({html: `Döküman başarıyla silindi.`, classes: 'rounded'});
    }).catch(function(error) {
      console.log(error);
      M.toast({html: `Döküman silinirken problem oldu, yetkiliye ulaşın.`, classes: 'rounded'});
    });
  });

  $(document).on('click', '.publishDocument', function() {
    const title = $('#title').val();
    const description = $('#description').val();
    if (doc.length === 0) {
        M.toast({html: `Döküman yayınlamadan önce en az bir PDF yüklemelisiniz.`, classes: 'rounded'});
        return;
    } else if (!title) {
      M.toast({html: `Döküman başlığını girmelisiniz.`, classes: 'rounded'});
      return;
    } else if (!description) {
      M.toast({html: `Döküman açıklamasını girmelisiniz.`, classes: 'rounded'});
      return;
    } else {
      const slug = slugify(title, {
      	replacement: "-",
      	lower: true
      });

      const date = new Date()
      const {displayName, photoURL, uid} = firebase.auth().currentUser;
      const userSlug = slugify(displayName, {
      	replacement: "-",
      	lower: true
      });
      M.toast({html: `Döküman başarıyla yayınlandı.`, classes: 'rounded'});
      db.doc(`document/${slug}`).set({
        title,
        description,
        doc,
        slug,
        date,
        uid,
        displayName,
        photoURL,
        userSlug,
        hasPreview: false
      });
      doc = null;
    }

  });

  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      return user.getIdToken()
        .then((token) => {
          // eslint-disable-next-line no-undef
          return fetch('/api/login', {
            method: 'POST',
            // eslint-disable-next-line no-undef
            headers: new Headers({ 'Content-Type': 'application/json' }),
            credentials: 'same-origin',
            body: JSON.stringify({ token })
          })
        }).then((res) => console.log(res))
    } else {
      // eslint-disable-next-line no-undef
      fetch('/api/logout', {
        method: 'POST',
        credentials: 'same-origin'
      })
    }
  })

  function handleLogin (provider) {
    let authProvider;
    switch (provider) {
      case 'google':
        authProvider = new firebase.auth.GoogleAuthProvider()
        break;
      case 'twitter':
        authProvider = new firebase.auth.TwitterAuthProvider()
        break;
      case 'facebook':
        authProvider = new firebase.auth.FacebookAuthProvider()
        break;
      default:
    }
    firebase.auth().signInWithPopup(authProvider)
      .then(result => {
        const {name, photoURL, displayName} = result.user;

        $('.name').text(displayName)
        M.toast({html: `Hoşgeldin ${displayName}`, classes: 'rounded'});

        const elem = document.querySelector('#login');
        const instance = new M.Modal.getInstance(elem);
        instance.close()

        userProfile.html(`<img class="modal-trigger circle" href="#settings" src="${photoURL}" alt="" width="42" style="position:absolute;margin-top:15px;margin-left:-15px;">`)
      })
      .catch((error) => {
        console.log(error)
      })
  }

  function handleLogout () {
    userProfile.html('<i class="modal-trigger material-icons account-icon" href="#login">account_circle</i>')
    $('.name').text('')

    const elem = document.querySelector('#settings');
    const instance = new M.Modal.getInstance(elem);
    instance.close()
    firebase.auth().signOut()
    M.toast({html: `Tekrar görüşmek üzere..`, classes: 'rounded'});
  }

  window.handleLogin = handleLogin;
  window.handleLogout = handleLogout;
})
