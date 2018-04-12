$(document).ready(function() {
    let baseUrl = window.location.protocol + '//' + window.location.host + '/';

    $('#useremailLogin').val('');
    $('#passwordLogin').val('');
    $('#useremailRegister').val('');
    $('#passwordRegister').val('');
    $('#passwordRegisterRep').val('');

    function infoModal(title, message) {
        $('#infoModal-title').html(title);
        $('#infoModal-message').html(message);
        $('#infoModal').modal('show');
    }

    $('#submitLogin').click(function(e) {
        $.ajax({
            type: 'post',
            url: baseUrl + 'login/attempt',
            data: {
                username: $('#useremailLogin').val(),
                password: $('#passwordLogin').val()
            },
            dataType: 'json',
            success: function(data) {
                if (data.err) {
                    infoModal('Login failed', data.err);
                } else {
                    window.location = baseUrl + data.url
                }
            }
        });
    });

    $('#submitRegister').click(function(e) {
        $.ajax({
            type: 'post',
            url: baseUrl + 'login/register',
            data: {
                username: $('#useremailRegister').val(),
                password: $('#passwordRegister').val(),
                passwordrep: $('#passwordRegisterRep').val()
            },
            dataType: 'json',
            success: function(data) {
                if (data.err) {
                    infoModal("Register failed", data.err);
                } else {
                    window.location = baseUrl + data.url
                }
            }
        });
    });
});
