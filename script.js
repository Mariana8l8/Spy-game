const slider = document.querySelector(".slider");
const leftBtn = document.querySelector(".left");
const rightBtn = document.querySelector(".right");

let traslateX = 0;
const slideNumber = document.querySelectorAll(".slide").length;
const step = 100 / slideNumber;

rightBtn.addEventListener("click", () => {
    if (traslateX === -100 + step) {
        return;
    }
    traslateX -= step;
    slider.style.transform = `translateX(${traslateX}%)`;
})

leftBtn.addEventListener("click", () => {
    if (traslateX === 0) {
        return;
    }
    traslateX += step;
    slider.style.transform = `translateX(${traslateX}%)`;
});