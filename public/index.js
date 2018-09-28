window.onload = function(){
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('coin').oninput = checkInput;
};

function checkInput(){
    var input = document.getElementById('coin').value;
    if(input === "" || parseInt(input) < 0){
        document.getElementById('submitBtn').disabled = true;
        document.getElementById('error').innerHTML = '*The value must be a positive number';
    }else{
        document.getElementById('submitBtn').disabled = false;
        document.getElementById('error').innerHTML = ''; 
    }
}