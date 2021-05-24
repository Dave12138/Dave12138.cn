function hideControl(className) {
    let l = document.getElementsByClassName(className);
    for (let i = 0; i < l.length; i++) {
        if (l[i].classList.contains("hidden")) {
            l[i].classList.remove("hidden");
        } else {
            l[i].classList.add("hidden");
        }
    }
}