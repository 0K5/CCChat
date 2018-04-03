(function() {
    let baseUrl = window.location.protocol + '//' + window.location.host + '/';

    $(document).ready(function() {
		$('#useremailLogin').val('');
        $('#passwordLogin').val('');
        $('#useremailRegister').val('');
        $('#passwordRegister').val('');
        $('#passwordRegisterRep').val('');

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
					if(data.err){
						$('#modalInfo').html(data.err);
						$('#errorModal').modal('show');
					}else{
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
					if(data.err){
						$('#modalInfo').html(data.err);
						$('#errorModal').modal('show');
					}else{
						window.location = baseUrl + data.url
					}
                }
            });
        });
    });
})();
