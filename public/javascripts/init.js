/* eslint-disable */
const ALLOWED_FILE_EXTENTIONS = ['doc', 'docx', 'ppt', 'pptx', 'pdf', 'xls', 'rtf', 'odt', 'odp']
var EXTENTION = 'pdf'

/* eslint-disable */
$(document).ready(() => {
  $('.tabs').tabs()
  $('.sidenav').sidenav({swipeable: true})
  $('.modal').modal();
  $('.uploadModal').modal();
  $('textarea').characterCounter();
  // $('.materialboxed').materialbox();

  $('.fixed-action-btn').floatingActionButton({
   direction: 'top', // Direction menu comes out
   hoverEnabled: false, // Hover enabled
   toolbarEnabled: false // Toolbar transition enabled
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
  const messaging = firebase.messaging()
  window.firebase = firebase

  function closeModalAndSuggestLogin(text = 'Dökümanı indirmeden görüntüleyebilmek, yayınlayan kişiden bildirim alabilmek gibi güzel özelliklerimizi kullanabilmek için giriş yapman gerekiyor 😔, aramızda seni de görmek isteriz 😇') {
    const elem = document.querySelector('#login');
    const instance = new M.Modal.getInstance(elem);
    $('#loginTitle').text('👻 Selam! 👋')
    $('#loginText').text(text)
    instance.open()
  }

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
        }).then((res) => {

          if (window.location.pathname.startsWith('/@')) {
            const user = firebase.auth().currentUser
            if (!user) {
              M.toast({html: `Bu kişi yeni bir döküman / özet yayınladığında bildirim almak istersen giriş yaparak bildirim butonunu kullanabilirsin.`, classes: 'rounded'})
            }
            const uid = $('.enableNotifications').attr('uid') // Visited Profile UID
            let query = `user/${uid}/follower/${user.uid}`

            db.doc(query).get().then(amIFollower).catch(console.log)

            function amIFollower (amI) {
              console.log(amI.exists, 'ben takip ediyom mu');
              $('.enableNotifications > a > i').html(amI.exists ? 'notifications_active': 'notifications')
            }

            // $('.enableNotifications > a > i').html('notifications_active') // Bildirimler açık
            $(document).on('click', '.enableNotifications', async function() {
              let isUnfollow = $('.enableNotifications > a > i').html() === 'notifications_active'
              if (!user) {
                M.toast({html: `Giriş yapmadığın için bildirimleri takip edemezsin :(`, classes: 'rounded'})
                return
              }
              if (isUnfollow) {
                M.toast({html: `Artık bu kullanıcının yayınından bir haber kalacaksın..`, classes: 'rounded'})
              } else {
                M.toast({html: `Süpeer, artık kullanıcının yüklediği dökümanları tarayıcı bildirimi olacak alabileceksin..`, classes: 'rounded'})
              }
              let meta = await db.doc(`user/${user.uid}`).get().then(snap => snap.data()).catch(console.log)
              console.log(meta);

              if (isUnfollow) {
                db.doc(query).delete().catch(console.log)
                $('.enableNotifications > a > i').html('notifications')
              } else {
                db.doc(query)
                .set({
                	date: new Date(),
                	displayName: user.displayName,
                  photoURL: user.photoURL,
                	slug: meta.slug,
                	uid: user.uid
                })
                $('.enableNotifications > a > i').html('notifications_active')
              }


            })
          }

        })
    } else {
      // eslint-disable-next-line no-undef
      fetch('/api/logout', {
        method: 'POST',
        credentials: 'same-origin'
      })
      if (window.location.pathname !== '/' && window.location.pathname === '/ozet' && firebase.auth().currentUser === null) {
        setTimeout(function () {
          if (window.location.pathname.startsWith('/~')) {
            closeModalAndSuggestLogin("Bu özet işine yaradı mı 🧠, sende bu tarz özetleri oluşturabilir 💪 ve biz arkadaşlarına yardımcı olabilirsin 🤓")
          } else {
            closeModalAndSuggestLogin()
          }
        }, 5500);
      }
    }
  })

  let doc;

  $(document).on('click', '#uploadModal', () => {
    if (!firebase.auth().currentUser) {
      const elem = document.querySelector('#uploadModal');
      const instance = new M.Modal.getInstance(elem);
      instance.close()
      closeModalAndSuggestLogin("Döküman yükleyebilmek için giriş yapman gerekiyor, seni aramızda görmek isteriz!")
    }
  })

  const userProfile = $('.userProfile')

  $(document).on('click', '.doLogin', function() {
    const provider = $(this).data('provider');
    handleLogin(provider)
  })

  $(document).on('click', '.doLogout', function() {
    handleLogout()
  })

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

      var reader = new FileReader();

      reader.onload = (function(theFile) {
        return function(e) {
          // TODO @cagatay file name can be insert unwanted js. `><img src=/ onerror=alert() />
          EXTENTION = theFile.name.split('.').pop()

          if (!ALLOWED_FILE_EXTENTIONS.includes(EXTENTION)) {
            return;
          }

          M.toast({html: `${theFile.name} yükleniyor...`, classes: 'rounded'});
          let date = new Date();
          date = date.valueOf(); // timestamp
          const file = date;
          date = `${date}.${EXTENTION}`;
          var pdfDocRef = storageRef.child(date);

          let uploadStatus = pdfDocRef.putString(e.target.result, 'data_url')

          uploadStatus.then(function(snapshot) {
            M.toast({html: `${theFile.name} başarıyla yüklendi.`, classes: 'rounded'});

            storageRef.child(date).getDownloadURL().then(function(url) {
              doc = {name: date, url, id: file, type: EXTENTION};
              // TODO @cagataycali when user delete things dom have to change.
              // TODO @cagataycali magic happen here. PDF TO GIF.
              M.toast({html: `Döküman başarıyla yüklendi.`, classes: 'rounded'});
              $('.publishDocument').removeClass('disabled');
            })
          })
          .catch(error => {
            console.log(error);
            M.toast({html: `Yeni bir döküman yayınlama yetkiniz yok veya bir problem oldu :)`, classes: 'rounded'});
          })

          uploadStatus.on('state_changed', function(snapshot){
              // Observe state change events such as progress, pause, and resume
              // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
              var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              M.toast({html: `Dökümanın %${progress.toFixed(2)} kadarı yüklendi.`, classes: 'rounded'});
              switch (snapshot.state) {
                case firebase.storage.TaskState.PAUSED: // or 'paused'
                  M.toast({html: `Dökümanın %${Math.round(progress)}'si yüklenmişken durduruldu`, classes: 'rounded'});
                  break;
                case firebase.storage.TaskState.RUNNING: // or 'running'
                  console.log('Upload is running');
                  break;
              }
            }, function(error) {
              // Handle unsuccessful uploads
            }, function() {
              console.log('Upload done!');
            });


          const content = `
          <div class="col s12 m4 document-${file}">
            <div class="card">
              <span class="card-title truncate">${escape(theFile.name)}</span>
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

  $(document).on('click', '.deleteDocument', function() {
    db.doc(`document/${document.location.pathname.split('/').pop()}`)
      .delete()
      .then(function() {
        M.toast({html: `Döküman başarıyla silindi.`, classes: 'rounded'})
        setTimeout(() => {
          window.location = `/`
        }, 1000)
      })
      .catch(function(error) {
        M.toast({html: `Döküman silinirken hata oluştu.`, classes: 'rounded'})
        console.log(error)
      })
  });

  $(document).on('click', '.editDoc', async () => {
    let title = $('#title').text()
    let description = $('#description').text()
    console.log(title, description);
    $('#editTitle').val(title)
    $('#editDescription').val(description)
  })

  $(document).on('click', '.updateDocument', async () => {
    let title = $('#editTitle').val()
    let description = $('#editDescription').val()
    db.doc(`document/${document.location.pathname.split('/').pop()}`).update({
      title, description
    })
    .then(() => {
      M.toast({html: `Dökümanı güncelledin!`, classes: 'rounded'});
      $('#title').text(title)
      $('#description').text(description)
    })
    .catch(err => {
      M.toast({html: `Dökümanı güncelleyemedim :(`, classes: 'rounded'});
    })
  })

  $(document).on('click', '.publishDocument', async () => {
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
      let slug = slugify(title, {
      	replacement: "-",
      	lower: true
      })

      try {
        let checkSlug = await db.collection('document').where('slug', '==', slug).get()
        if (checkSlug.size !== 0) {
          slug += `-${checkSlug.size}`
        }
      } catch (e) {
        console.log(e)
      } finally {
        console.log(slug)
      }

      const date = new Date()
      const {displayName, photoURL, uid} = firebase.auth().currentUser;
      let userSlug
      try {
        let u = await db.doc(`user/${uid}`).get()
        u = u.data()
        userSlug = u.slug
      } catch (e) {
        userSlug = slugify(displayName, {
        	replacement: ' ',
        	lower: true
        }).split(' ').join('')
      }
      M.toast({html: `Döküman başarıyla yayınlandı.`, classes: 'rounded'});
      M.toast({html: `5 Saniye içerisinde dökümana yönlendirileceksiniz...`, classes: 'rounded'});
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
        type: EXTENTION,
        hasProcessed: EXTENTION === 'pdf',
        hasPreview: false
      });

      setTimeout(() => {
        window.location = `/dokuman/${slug}`
      }, 5000)
      doc = null;
      EXTENTION = null;
    }

  });

  function handleLogin (provider) {
    let authProvider;
    switch (provider) {
      case 'google':
        authProvider = new firebase.auth.GoogleAuthProvider()
        break;
      case 'facebook':
        authProvider = new firebase.auth.FacebookAuthProvider()
        break;
      default:
    }
    firebase.auth().signInWithPopup(authProvider)
      .then(result => {
        console.log('burada user giriş yaptı', result);
        const {name, photoURL, displayName} = result.user;

        $('.name').text(displayName)
        M.toast({html: `Hoşgeldin ${displayName}`, classes: 'rounded'})

        const elem = document.querySelector('#login');
        const instance = new M.Modal.getInstance(elem);
        instance.close()

        userProfile.html(`<img class="modal-trigger circle" href="#settings" src="${photoURL}" alt="" width="42" style="position:absolute;margin-top:15px;margin-left:-15px;">`)

        if (window.location.pathname !== '/' && window.location.pathname !== '/ozet') {
          setTimeout(function () {
            M.toast({html: `5 Saniye içerisinde dökümana yönlendirileceksiniz...`, classes: 'rounded'});
            window.location.reload()
          }, 4500);
        }
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
    if (window.location.pathname !== '/' && window.location.pathname !== '/ozet') {
      setTimeout(function () {
        window.location.reload()
      }, 300);
    }
  }

  if (window.location.pathname.startsWith('/ozet')) {
    const isUpdate = window.location.pathname.startsWith('/ozet/duzenle')
    if (isUpdate) {
      let slug = decodeURI(window.location.pathname.split('/ozet/duzenle/')[1])
      console.log(slug);
       db.collection('syllabus').where('slug', '==', slug)
        .get()
        .then(snapShot => snapShot.docs[0].data())
        .then(syl => editor.setData(syl.content))
    }
    $(document).on('click', '.saveSyllabus',async () => {
      M.toast({html: `Süper, özet içeriğini hemen işliyorum!`, classes: 'rounded'})

      let content = editor.getData() // HTML
      let context = jQuery(content).text() // TEXT
      let title = jQuery(jQuery(content)[0]).text()
      let slug =  slugify(title, {
      	replacement: "-",
      	lower: true
      })

      if (!isUpdate) {
        try {
          let checkSlug = await db.collection('syllabus').where('slug', '==', slug).get()
          if (checkSlug.size !== 0) {
            slug += `-${checkSlug.size}`
          }
        } catch (e) {
          console.log(e) // TODO @cagataycali bugsnag
        }
      }

      const date = new Date()
      const {displayName, photoURL, uid} = firebase.auth().currentUser;
      let userSlug
      try {
        let u = await db.doc(`user/${uid}`).get()
        u = u.data()
        userSlug = u.slug
      } catch (e) {
        userSlug = slugify(displayName, {
        	replacement: ' ',
        	lower: true
        }).split(' ').join('')
      }
      if (isUpdate) {
        try {
          db.doc(`syllabus/${slug}`).update({
            title,
            content,
            context,
            date,
          })
        } catch (e) {
          console.log(e);
        } finally {

        }
        M.toast({html: `Özet güncellendi.`, classes: 'rounded'})
      } else {
        db.doc(`syllabus/${slug}`).set({
          title,
          content,
          context,
          slug,
          date,
          uid,
          displayName,
          photoURL,
          userSlug,
          hasProcessed: false
        })
        M.toast({html: `Özet başarıyla yayınlandı.`, classes: 'rounded'})
      }
      M.toast({html: `5 Saniye içerisinde özete yönlendirileceksiniz...`, classes: 'rounded'})
      setTimeout(() => {
        window.location = `/~${slug}`
      }, 5000)
    })
  }

  if (window.location.pathname.startsWith('/~')) {
    let slug = decodeURI(window.location.pathname.split('/~')[1])
    async function getSyllabus(slug) {
      let snapshot = await db.doc(`syllabus/${slug}`).get()
      let data = snapshot.data()
      console.log(data);


      function getId(url) {
          var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
          var match = url.match(regExp);

          if (match && match[2].length == 11) {
              return match[2];
          } else {
              return 'error';
          }
      }
      var generateIFrame = id => `<iframe width="560" height="315" src="//www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe>`

      var object = jQuery(data.content)
      for (var i = 0; i < object.length; i++) {
          var id = getId(object[i].innerText);
          if (id != 'error') {
            let p = document.createElement('p')
            p.innerHTML = generateIFrame(id)
            object[i] = p
            console.log(i);
          } else {
            object[i]
          }
      }
      $('.loading').slideUp('slow')
      $('.content').html(object).slideDown('slow')
    }
    getSyllabus(slug)

    $(document).on('click', '.removeSyllabus', () => {
      const slug = decodeURI(window.location.pathname.split('/~')[1])
      console.log(slug);
      M.toast({html: `Özet bilgi dağarcığımızı en iyi yansıtma yönümüzdü ama..`, classes: 'rounded'})
      db.doc(`syllabus/${slug}`)
        .delete()
        .then(function() {
          M.toast({html: `Özet başarıyla silindi.`, classes: 'rounded'})
          setTimeout(() => {
            window.location = `/`
          }, 1000)
        })
        .catch(function(error) {
          M.toast({html: `Özet silinirken hata oluştu.`, classes: 'rounded'})
          console.log(error)
        })
    })
  }

  $(document).on('click', '.notifications', async () => {
    if (!firebase.auth().currentUser) {
      M.toast({html: `Bildirimler çok rahatsız edici değil mi sence de?`, classes: 'rounded'})
      M.toast({html: `Bunu gerçekten istiyorsan giriş yapmanı tavsiye ederim.`, classes: 'rounded'})
      closeModalAndSuggestLogin()
      return
    }
    const {uid} = firebase.auth().currentUser;

    await messaging.requestPermission()
      .catch(console.log)
    messaging.getToken()
    .then(function(token) {
      if (token) {
        console.log(token);
        db.doc(`user/${uid}`).update({token}).then(() => console.log('Token saved')).catch(console.log)
      } else {
        // Show permission request.
        console.log('No Instance ID token available. Request permission to generate one.')
        M.toast({html: `Size bildirim gönderebilmemiz için bildirim ayarlarınızdan izin vermiş olmanız gerekiyor :(`, classes: 'rounded'})
        messaging.requestPermission()
          .catch(console.log)
      }
    })
    .catch(console.log)

    messaging.onTokenRefresh(function() {
      messaging.getToken()
      .then(function(refreshedToken) {
        db.doc(`user/${uid}`).update({token: refreshedToken}).then(() => console.log('Token refreshed')).catch(console.log)
      })
      .catch(console.log)
    })
  })

  $(document).on('click', '.goTo', function() {
    window.location = `/~${$(this).attr('id')}`
  })

  messaging.onMessage(function(payload) {
    console.log("Message received. ", payload);
    // ...
  });

})
