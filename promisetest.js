/**
 * Created by i841928 on 6/4/18.
 */


function executeSerially(promiseArray) {
    let index = 0;

    function executePromise() {

        if (index < promiseArray.length) {
            return indivPromise(promiseArray[index++]).then(()=> executePromise());
        }
    }
    return executePromise();
}


function indivPromise(item) {
    return new Promise((resolve, reject) => {
        console.log(item);
        resolve('done');
    });
}


let myarray = ["hello", "how", "are", "you", "are", "we", "going", "today"];
executeSerially(myarray).then(() => {
        console.log("all done");
        executeSerially([1, 2, 3, 4]).then(() =>{console.log("finished")})
    });


