/* eslint-disable */
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
console.log(object)
