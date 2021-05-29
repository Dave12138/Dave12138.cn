function JumpTo(str) {
    let div = document.getElementById("subpage");
    div.innerHTML = `<object class="page" type="text/x-scriptlet" data="${str}"/>`;
    setTimeout(dropListenerUpdate, 200);

}

function dropListenerUpdate() {
    let div = document.getElementById("subpage");
    let ob = div.firstChild;
    div.ondrop = ob.contentDocument.ondrop;
    div.ondragover = ob.contentDocument.ondragover;
    ob.contentDocument.body.onpagehide = function () {
        setTimeout(dropListenerUpdate, 100);
    }
}

(function () {
    document.getElementsByClassName("info-box-title")[0].onclick = function () {
        JumpTo("/html/Hello.html" + window.location.search);
    };
    document.getElementsByClassName("info-box-title")[0].click();
})();