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
  let needPulse = true;

  // Anahtar kelimere erişmek için..
  // var instance = M.Chips.getInstance($('#keywords')[0].M_Chips.el);

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

  let categories = localStorage.getItem('categories')

  if (!categories) {
    console.log('Local storage is empty, I try to get categories');
    db.collection('category')
      .orderBy('count', 'desc')
      .limit(50)
      .get()
      .then(snapshot => {
        categories = snapshot.docs.map(doc => doc.data())
        localStorage.setItem('categories', JSON.stringify(categories))
        generateChips()
      })
      .catch(console.log)
  } else {
    console.log('Local storage have categories');
    console.log(JSON.parse(categories));
    generateChips()
  }

  function svgGenerator(number) {
    if (number > 100 && number < 1000) {
      number = '99+'
    } else if (number > 1000 && number < 2000) {
      number = '1k'
    } else if (number > 2000 && number < 3000) {
      number = '2k'
    } else if (number > 3000 && number < 4000) {
      number = '3k'
    } else if (number > 4000 && number < 5000) {
      number = '4k'
    } else if (number > 5000 && number < 10000) {
      number = '5k'
    } else if (number > 10000 && number < 50000) {
      number = '10k'
    } else if (number > 50000 && number < 1000000) {
      number = '50k'
    } else if (number > 1000000) {
      number = '1m'
    }
    return `https://media.ders.im/circle/${number}.png`
  }

  function generateChips () {
    let data = {}
    let chipsData = JSON.parse(localStorage.getItem('categories'))

    chipsData.map(topic => {
      data[topic.title] = svgGenerator(topic.count)
    })
    window.autocomplete = data

    $('.chips-autocomplete').chips({
      data: [],
      autocompleteOptions: {
        data,
        limit: 5,
        minLength: 1,
      },
      limit: 5,
      placeholder: 'Anahtar kelime ekle',
      secondaryPlaceholder: '+ekle',
    })
  }

  $(document).on('click', '[href="#editModal"]', _ => {
    let path = window.location.pathname;
    let isDoc = path.startsWith('/dokuman/')
    if (isDoc) {
      let docSlug = path.split('/dokuman/')[1]
      db.doc(`document/${docSlug}`).get().then(doc => {
        if (doc.exists) {
          let keywords = doc.data().keywords || []
          $('.chips-autocomplete').chips({
            data: keywords,
            autocompleteOptions: {
              data: window.autocomplete,
              limit: 5,
              minLength: 1,
            },
            limit: 5,
            placeholder: 'Anahtar kelime ekle',
            secondaryPlaceholder: '+ekle',
          })
        }
      })
    }
  })

  $(document).on('click', '#uploadModalTrigger', _ => {
    db.collection('category')
      .orderBy('count', 'desc')
      .limit(25)
      .get()
      .then(snapshot => {
        categories = snapshot.docs.map(doc => doc.data())
        localStorage.setItem('categories', JSON.stringify(categories))
      })
      .catch(console.log)
  })

  try {
    let category = document.referrer.split('/kategori/')[1]
    let path = window.location.pathname;
    let isDoc = path.startsWith('/dokuman/')
    if (category.length > 0 && isDoc) {
      let docSlug = path.split('/dokuman/')[1]
      fetch(`/api/view/${category}/${docSlug}`).then(r => r.json())
        .then(console.log)
        .catch(console.log)
    }
  } catch (e) {
    console.log(e);
    console.log('H3ll0');
  }



  async function notifications() {
    const user = firebase.auth().currentUser;

    if (!user) {
      M.toast({html: `Bu kişi yeni bir döküman / özet yayınladığında bildirim almak istersen giriş yaparak bildirim özelliğini kullanabilirsin.`, classes: 'rounded'})
      return
    }
    const {uid} = user

    await messaging.requestPermission()
      .catch(console.log)
    messaging.getToken()
    .then(function(token) {
      if (token) {
        db.doc(`user/${uid}`).update({token}).catch(console.log)
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
        db.doc(`user/${uid}`).update({token: refreshedToken}).catch(console.log)
      })
      .catch(console.log)
    })
  }

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
        }).then(res => {
          window.limit = res.limit
          if (window.location.pathname.startsWith('/@')) {
            const user = firebase.auth().currentUser
            const uid = $('.enableNotifications').attr('uid') // Visited Profile UID
            let query = `user/${uid}/follower/${user.uid}`
            let enableNotif = $('.enableNotifications > a > i')
            db.doc(query).get().then(amIFollower).catch(console.log)

            function amIFollower (amI) {
              $('.enableNotifications > a > i').html(amI.exists ? 'notifications_active': 'notifications')
              amI.exists && $('#pulse').removeClass('pulse')
            }

            // enableNotif.html('notifications_active') // Bildirimler açık
            $(document).on('click', '.enableNotifications', async function() {

              if (!user) {
                M.toast({html: `Bu kişi yeni bir döküman / özet yayınladığında bildirim almak istersen giriş yaparak bildirim özelliğini kullanabilirsin.`, classes: 'rounded'})
                return
              }
              notifications()

              let isUnfollow = enableNotif.html() === 'notifications_active'
              if (!user) {
                M.toast({html: `Giriş yapmadığın için bildirimleri takip edemezsin :(`, classes: 'rounded'})
                return
              }
              if (isUnfollow) {
                M.toast({html: `Artık bu kullanıcıdan bildirim almayacaksın`, classes: 'rounded'})
                $('#pulse').addClass('pulse')
              } else {
                M.toast({html: `Süpeer, artık kullanıcının yüklediği dökümanları tarayıcı bildirimi olacak alabileceksin..`, classes: 'rounded'})
                $('#pulse').removeClass('pulse')
              }
              let meta = await db.doc(`user/${user.uid}`).get().then(snap => snap.data()).catch(console.log)

              if (isUnfollow) {
                db.doc(query).delete().catch(console.log)
                enableNotif.html('notifications')
              } else {
                db.doc(query)
                .set({
                	date: new Date(),
                	displayName: user.displayName,
                  photoURL: user.photoURL,
                	slug: meta.slug,
                	uid: user.uid
                })
                enableNotif.html('notifications_active')
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
      .then(res => res.json())
      .then(res => {
        window.limit = res.limit
      })
      if (window.location.pathname !== '/' && firebase.auth().currentUser === null) {
        setTimeout(function () {
          if (window.location.pathname.startsWith('/~')) {
            closeModalAndSuggestLogin("Bu özet işine yaradı mı 🧠, sende bu tarz özetleri oluşturabilir 💪 ve biz arkadaşlarına yardımcı olabilirsin 🤓")
          } else if (window.location.pathname.startsWith('/~')) {
            M.toast({html: `Bu kişi yeni bir döküman / özet yayınladığında bildirim almak istersen giriş yaparak bildirim özelliğini kullanabilirsin.`, classes: 'rounded'})
            closeModalAndSuggestLogin('Bu kişi yeni bir döküman / özet yayınladığında bildirim almak istersen giriş yaparak bildirim özelliğini kullanabilirsin.')
          } else {
            if (window.location.pathname.startsWith('/@')) {
              var elem = $('.tap-profile').featureDiscovery();
              $('#fab > a').addClass('pulse')
              setTimeout(function () {
                $('#fab > a').removeClass('pulse')
                needPulse = false
              }, 1000 * 10);
            } else if (window.location.pathname.startsWith('/dokuman/')) {

            } else {
              closeModalAndSuggestLogin()
            }
          }
        }, 5500);
      } else if (window.location.pathname === '/') {
        var elem = $('.tap-target').featureDiscovery();
        var featureDiscovery = elem[0].M_FeatureDiscovery

        $('#fab > a').addClass('pulse')
        setTimeout(function () {
          $('#fab > a').removeClass('pulse')
          needPulse = false
        }, 1000 * 10);

        setTimeout(function () {
          featureDiscovery.open()
        }, 3000);
      }
    }
  })

  let doc;
  let next = null

  $(document).on('click', '.downloadButton', (e) => {
    if (window.limit <= 0) {
      e.preventDefault()
      // closeModalAndSuggestLogin("Giriş yapmadan sadece tek bir döküman indirebilirsin 😉")
      const elem = document.querySelector('#share');
      const instance = new M.Modal.getInstance(elem);
      instance.open()
    } else {
      fetch('/api/download', {
        method: 'GET',
        credentials: 'same-origin'
      })
      .then(res => res.json())
      .then(res => {
        window.limit = res.limit
      })
    }
  })

  $(document).on('click', '#share-buttons > a', (e) => {
    fetch('/api/gain', {
      method: 'GET',
      credentials: 'same-origin'
    })
    .then(res => res.json())
    .then(res => {
      window.limit = res.limit
    })
  })

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

            storageRef.child(date).getDownloadURL().then(function(url) {
              doc = {name: date, url, id: file, type: EXTENTION};
              M.toast({html: `Döküman başarıyla yüklendi.`, classes: 'rounded'});
              $('.publishDocument').removeClass('disabled');
            })
          })
          .catch(error => {
            M.toast({html: `Yeni bir döküman yayınlama yetkiniz yok veya bir problem oldu :)`, classes: 'rounded'});
          })

          let counter = 0
          uploadStatus.on('state_changed', snapshot => {
              // Observe state change events such as progress, pause, and resume
              // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
              counter++
              var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              if (counter % 5 === 0) {
                M.toast({html: `Dökümanın %${progress.toFixed(2)} kadarı yüklendi.`, classes: 'rounded'});
                counter = 0
              }

              switch (snapshot.state) {
                case firebase.storage.TaskState.PAUSED: // or 'paused'
                  M.toast({html: `Dökümanın %${Math.round(progress)}'si yüklenmişken durduruldu`, classes: 'rounded'});
                  break;
                case firebase.storage.TaskState.RUNNING: // or 'running'
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
      })
  });

  $(document).on('click', '.editDoc', async () => {
    let title = $('#title').text()
    let description = $('#description').text()
    let source = $('#source').text()
    $('#editTitle').val(title)
    $('#editDescription').val(description)
    $('#editSource').val(source)
  })

  $(document).on('click', '.updateDocument', async () => {
    let title = $('#editTitle').val()
    let description = $('#editDescription').val()
    let source = $('#editSource').val()
    let keywords =  M.Chips.getInstance($('#editKeywords')[0].M_Chips.el);
    keywords = keywords.getData()
    db.doc(`document/${document.location.pathname.split('/').pop()}`).update({
      title, description, source, keywords
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
    const source = $('#source').val();
    let keywords = M.Chips.getInstance($('#keywords')[0].M_Chips.el);
    keywords = keywords.getData()
    if (doc.length === 0) {
        M.toast({html: `Döküman yayınlamadan önce en az bir PDF yüklemelisiniz.`, classes: 'rounded'});
        return;
    } else if (!title) {
      M.toast({html: `Döküman başlığını girmelisiniz.`, classes: 'rounded'});
      return;
    } else if (!description) {
      M.toast({html: `Döküman açıklamasını girmelisiniz.`, classes: 'rounded'});
      return;
    } else if (keywords.length === 0) {
      M.toast({html: `Dökümana en az bir etiket girmelisiniz.`, classes: 'rounded'});
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
        source,
        keywords,
        type: EXTENTION,
        hasProcessed: EXTENTION === 'pdf',
        hasPreview: false
      }).then(_ => window.location = `/dokuman/${slug}`)

      // setTimeout(() => {
      //   window.location = `/dokuman/${slug}`
      // }, 5000)
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
      .catch(console.log)
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
    notifications()
  })

  $(document).on('click', '.goTo', function() {
    window.location = `/~${$(this).attr('id')}`
  })

  messaging.onMessage(function(payload) {
    console.log("Message received. ", payload);
    // ...
  });

  $('#fab').on('click', () => {
    needPulse = false
  })

  if (window.location.pathname === '/' || window.location.pathname.startsWith('/@')) {

    let isProfile = window.location.pathname.startsWith('/@')
    let slug = $('.card').last().data('slug')
    window.isInitialized = false
    db.doc(`document/${slug}`).get().then(last => {
      window.isInitialized = true
      window.last = last
    })

    moment.locale('tr')

    let isLoading = false
    $(window).scroll(async () => {
       if (($(window).scrollTop() >= $(document).height() - $(window).height() - 10) && !isLoading && window.isInitialized) {
        isLoading = true
        $('.shape-separator').slideToggle("slow")
        let nextDocs
        if (isProfile) {
          let slug = window.location.pathname.split('/@')[1]
          nextDocs = await db.collection('document')
            .where('userSlug', '==', slug)
            .orderBy('date', 'desc')
            .startAfter(window.last)
            .limit(12)
            .get()
        } else {
          nextDocs = await db.collection('document')
            .orderBy('date', 'desc')
            .startAfter(window.last)
            .limit(12)
            .get()
        }

        window.last = nextDocs.docs[nextDocs.docs.length-1]
        nextDocs = nextDocs.docs.map(doc => doc.data())
        nextDocs.forEach(doc => {
          $('#infinite-list').append(`
            <div class="col s12 m3">
              <div class="card hoverable" data-slug="${doc.slug}">
               <a href="/dokuman/${doc.slug}">
                  <div class="card-image"><img width="245" height="346" src="${doc.thumbnail.url}" alt="${filterXSS(doc.description)}" style="opacity:0.4;filter:blur(1px);">
                  <span class="card-title truncateC" style="font-weight:300;filter: invert(100%);">${filterXSS(doc.title)}</span></div>
                  <div class="card-action">
                     <div class="chip truncate">
                     <img src="${doc.photoURL}" alt="${filterXSS(doc.displayName)}">${filterXSS(doc.displayName)}</div>
                     <div class="chip truncate">${moment(doc.date).fromNow()}</div>
                  </div>
               </a>
               </div>
            </div>
            `)
        })
        isLoading = false
        $('.shape-separator').slideToggle("slow")
       }
    });
  }

  if (window.location.pathname.startsWith('/kategori/')) {

    let categorySlug = window.location.pathname.split('/kategori/')[1]
    let slug = $('.card').last().data('slug')
    window.isInitialized = false
    db.doc(`category/${categorySlug}/document/${slug}`).get().then(last => {
      window.isInitialized = true
      window.last = last
    })

    moment.locale('tr')

    let isLoading = false
    $(window).scroll(async () => {
       if (($(window).scrollTop() >= $(document).height() - $(window).height() - 10) && !isLoading && window.isInitialized) {
        isLoading = true
        $('.shape-separator').slideToggle("slow")
        let nextDocs = await db.collection(`category/${categorySlug}/document`)
          .orderBy('viewCount', 'desc')
          .startAfter(window.last)
          .limit(12)
          .get()

        window.last = nextDocs.docs[nextDocs.docs.length-1]
        nextDocs = nextDocs.docs.map(doc => doc.data())
        nextDocs.forEach(doc => {
          $('#infinite-list').append(`
            <div class="col s12 m3">
              <div class="card hoverable" data-slug="${doc.slug}">
               <a href="/dokuman/${doc.slug}">
                  <div class="card-image"><img width="245" height="346" src="${doc.thumbnail.url}" alt="${filterXSS(doc.description)}" style="opacity:0.4;filter:blur(1px);">
                  <span class="card-title truncateC" style="font-weight:300;filter: invert(100%);">${filterXSS(doc.title)}</span></div>
                  <div class="card-action">
                     <div class="chip truncate">
                     <img src="${doc.photoURL}" alt="${filterXSS(doc.displayName)}">${filterXSS(doc.displayName)}</div>
                     <div class="chip truncate">${moment(doc.date).fromNow()}</div>
                  </div>
               </a>
               </div>
            </div>
            `)
        })
        isLoading = false
        $('.shape-separator').slideToggle("slow")
       }
    });
  }
})
