const ipcRenderer = window.EDCarnage.ipcRenderer;
const hbsMain = window.EDCarnage.hbsMain;

function loadData() {
    const data = ipcRenderer.sendSync('request-data', 'journal');
    console.log(data);
    $('body').html(hbsMain(data));
    $(`.lvl3`).hide();

    for (const detailButton of [1, 2, 3]) {
        $(`#lvl${detailButton}`).on('click', function () {
            for (const lvl of [1, 2, 3]) {
                $(`#lvl${lvl}`).removeClass('active');
                if (lvl <= detailButton) $(`.lvl${lvl}`).show();
                else $(`.lvl${lvl}`).hide();
            }
            $(`#lvl${detailButton}`).addClass('active');
        });
    }
}

$(function () {
    console.log(hbsMain, ipcRenderer);

    setInterval(loadData, 5 * 1000);
    loadData();
});
