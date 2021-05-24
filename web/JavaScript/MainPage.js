function JumpTo(str) {

    subpage.innerHTML = "<object class=\"page\" type=\"text/x-scriptlet\" data=\"" + str + "\"></object>"
}

(function () {
    document.getElementsByClassName("info-box-title")[0].onclick = function () {
        JumpTo("/html/Hello.html" + window.location.search);
    };
    document.getElementsByClassName("info-box-title")[0].click();

})();