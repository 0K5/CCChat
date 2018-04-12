$(document).ready(function() {
    let baseUrl = window.location.protocol + '//' + window.location.host + '/';
    let socket = io.connect(baseUrl, {
        transports: ['websocket'],
        upgrade: false
    });
    let username = $('#username').val();
    let chat = {};
    let contacts = [];
    let streams = {};
    let dateOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour12: false,
        hour: 'numeric',
        minute: 'numeric'
    };
    let uploading = false;

    // Generic functions

    function infoModal(title, message) {
        $('#infoModal-title').html(title);
        $('#infoModal-message').html(message);
        $('#infoModal').modal('show');
    }

    $(document).on('click', '#modal-save', function(e) {
        if ($('#modalHidden').val() === 'createGrp') {
            groupAdd('group');
        } else if ($('#modalHidden').val() === 'addToGrp') {
            groupAdd('addToGrp');
        }
    });

    socket.on('logout', function() {
        window.location = baseUrl + 'login';
    });

    $(document).on('click', '#logout', function(e) {
		socket.emit('logout',{isLogout: true});
		socket.disconnect();
    });

    socket.on('connect', function() {
        socket.emit('init');
        socket.on('disconnect', function() {
            window.location = baseUrl + 'login';
        });
    });


    // All messaging functionalities

    function appendMessage(message) {
        let text = message.text || '',
            media = message.media || '',
            timestamp = message.timestamp || '',
            origin = message.origin || '',
            isReceiver = message.isReceiver || '';
        let content = '<li style="width:100%;">';
        if (message.origin) {
            content += isReceiver ? '<div class="msj macro">' : '<div class="msj-rta macro">';
            content += isReceiver ? '<div class="text text-l">' : '<div class="text text-r"';
            content += text ? '<p class="msgText">' + text + '</p>' : '';
            content += media ? '<div class="msgPic" ><img class="img-thumbnail" style="width:100%;" src="' + media + '" /></div>' : '';
            content += isReceiver ? '<p class="msgUser"><small>' + origin + '</small></p>' : '';
            content += '<p class="msgDate"><small>' + timestamp + '</small></p>';
        } else {
            content += '<div class="ntf macro">';
            content += '<div class="text text-m">';
            content += '<p class="ntfText"><small>' + text + '</small></p>';
            content += '<p class="msgDate"><small>' + timestamp + '</small></p>';
        }
        content += '</div></div></li>';
        $("#msgs").append(content).scrollTop($("#msgs").prop('scrollHeight'));
    }

    function messageNotification(token) {
        let notification = $('#contacts').find('#' + token).find('.notification');
        let current = parseInt((notification.val() || '0'));
        notification.val(++current);
    }

    socket.on('message', function(chat) {
        if ($('#tokenChat').val() === chat.token) {
            appendMessage(chat);
        } else {
            messageNotification(chat.token);
        }
    });

    function sendMsg() {
        let text = $('#msgInput').val(),
            token = $('#tokenChat').val();
        appendMessage({
            text: text,
            timestamp: (new Date()).toLocaleString('de-DE', dateOptions),
            origin: true
        });
        if (text) {
            socket.emit('message', {
                token: token,
                text: text
            });
            $('#msgInput').val('');
        }
    }

    $(document).on('click', '#sendMsg', function(e) {
        sendMsg();
    });

    $('#msgInput').keyup((event) => {
        if (event.keyCode === 13) {
            sendMsg();
        }
    });

    $("#msgGroupActions").addClass('hidden');


    // Send media functionalities
    function updateMedia(data) {
        let origin = data.origin || '',
            loadStatus = data.loadStatus || '',
            stid = data.stid || '',
            fileName = data.fileName || '',
            link = data.link || '',
            timestamp = data.timestamp || '',
            finished = data.finished || '';
        let content = '<li style="width:100%;">';
        let innerContent = '';
        if (link) {
            innerContent = '<a id="' + stid + '" style="width:100%;" href="' + link + '" download="' + fileName + '">Download ' + fileName + '</a>';
        } else {
            innerContent = origin + ' sending file ' + fileName + '. Loading ' + loadStatus;
        }
        if (!($('#' + data.stid).length)) {
            content += '<div class="msj macro">';
            content += '<div class="text text-l">';
            content += innerContent ? '<div class="msgText" id=' + data.stid + '>' + innerContent + '</div>' : '';
            content += fileName !== "You're" ? '<p class="msgUser"><small>' + origin + '</small></p>' : '';
            content += timestamp ? '<p class="msgDate"><small>' + timestamp + '</small></p>' : '';
            content += '</div></div></li>';
            $("#msgs").append(content).scrollTop($("#msgs").prop('scrollHeight'));
        } else {
            $('#' + data.stid).html(innerContent);
        }
    }

    function streamTransmitter(data) {
        this.blob = [];
        this.size = 0;
        this.load = function() {
            return Math.floor(this.size / data.size * 100) + '%';
        };
        this.on = function() {
            data.loadStatus = this.load();
            updateMedia(data);
        };
        this.once = function() {};
        this.write = function(chunk) {
            this.size += chunk.length;
            this.blob.push(chunk);
            data.loadStatus = this.load();
            setTimeout(updateMedia(data), data.loadStatus * 100);
        };
        this.end = function() {
            let b = new Blob(this.blob, {
                type: data.type
            });
            let url = window.URL.createObjectURL(b);
            data.link = url;
            data.fileName = data.name;
            updateMedia(data);
            $('#' + data.stid).on('click', function(e) {
                setTimeout(function() {
                    window.URL.revokeObjectURL(url);
                }, 10000);
            });
        };
        this.emit = function() {};
        this.prependListener = function() {};
    }

    ss(socket).on('openStream', function(stream, data) {
        stream.pipe(new streamTransmitter(data))
    });

    $(document).on('click', '#sendMedia', function(e) {
        if (!uploading) {
            $('#fileImport').trigger('change');
        } else {
            infoModal('Still uploading', 'Wait for file transfer to finish');
        }
    });

    $('#fileImport').on('change', function() {
        let fi = document.getElementById('fileImport');
        if (fi.files && fi.files[0] && !uploading) {
            let file = fi.files[0];
            if (file.size < 50000000) {
                uploading = true;
                streams[file.name] = $('#tokenChat').val();
                let stream = ss.createStream();
                ss(socket).emit('sendMedia', stream, {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    token: $('#tokenChat').val()
                });
                let blopStream = ss.createBlobReadStream(file);
                let size = 0;
                let stid = '_' + Math.random().toString(36).substr(2, 9);
                blopStream.on('data', function(chunk) {
                    size += chunk.length;
                    updateMedia({
                        fileName: file.name,
                        loadStatus: Math.floor(size / file.size * 100) + '%',
                        origin: "You're",
                        stid: stid
                    });
                    if (size === file.size) {
                        uploading = false;
                        document.getElementById('fileImport').value = null;
                    }
                });
                blopStream.pipe(stream);
            } else {
                infoModal('File upload', 'You can only send files under 50MB');
            }
        }
    });

    // All chat functionalities

    function appendChat(chat) {
        let name = chat.name || '',
            token = chat.token || '',
            notification = chat.notification || '',
            isGroup = chat.isGroup || '';
        if (token && name) {
            let content = '<li style="width:100%">' +
                '<div class="chat msj macro" ';
            content += 'id="' + token + '">';
            content += '<div class="text text-l';
            content += '<p class="cntName">' + name + '</p>';
            content += '<p class="notification"><small>' + notification + '</small></p>';
            content += isGroup ? '<p class="isGroup"><small>Group</small></p>' : '';
            content += '</div></div></li>';
            $("#chats").append(content).scrollTop($("#chats").prop('scrollHeight'));
        }
    }

    socket.on('loadChat', function(data) {
        $('#msgs').empty();
        chat = data.chat;
        $('#contacts').find('#' + data.token).find('.notification').val('');
        $('#chatName').text(chat.name);
        $('#tokenChat').val(chat.token);
        $("#msgInput").show();
        $("#sendMedia").show();
        $("#sendMsg").show();
        $("#fileImport").hide();
        if (chat.isGroup) {
            $("#addToGrp").show();
            $("#leaveGrp").show();
            $("#infoGrp").show();
        } else {
            $("#addToGrp").hide();
            $("#leaveGrp").hide();
            $("#infoGrp").hide();
        }
        if (chat.messages) {
            chat.messages.forEach((msg) => {
                appendMessage(msg);
            });
        }
    });

    socket.on('allChats', function(data) {
        $('#chats').empty();
        data.chats.forEach((chat) => {
            appendChat(chat);
        });
    });

    socket.on('newChat', function(data) {
        appendChat(data.chat);
    });

    socket.on('removeChat', function(data) {
        $('#' + data.token).closest('li').remove();
    });

    $(document).on('click', '.chat', function(e) {
        let token = e.target.closest(".chat").id
        socket.emit('openChat', {
            token: token
        });
    });

    // All group functionalities

    socket.on('addToGrp', function(data) {
        if (!($('#' + data.chat.token).length)) {
            appendChat(data.chat);
            chat = data.chat;
        }
        if ($('#tokenChat').val() === data.chat.token) {
            appendMessage(data.msg);
        }
    });

    socket.on('leaveGrp', function(data) {
        appendMessage(data.msg);
    });

    $(document).on('click', '#createGrp', function(e) {
        if (!$('#addGrpInput').val()) {
            infoModal('Information', 'Groupname cannot be empty, please type in a group name');
        } else {
            $('#modalList').empty();
            $('#modalHidden').val('createGrp');
            for (ci in contacts) {
                appendContact(contacts[ci], 'modalList', true);
            }
            $('#chatModal').modal('show');
        }
    });

    $(document).on('click', '#leaveGrp', function(e) {
        let token = $("#tokenChat").val();
        $("#tokenChat").val('xxx');
        $("#msgInput").hide();
        $("#sendMedia").hide();
        $("#sendMsg").hide();
        $("#fileImport").hide();
        $("#addToGrp").hide();
        $("#leaveGrp").hide();
        $("#infoGrp").hide();
        $("#msgs").empty();
        $('#' + token).closest('li').remove();
        socket.emit('leaveGrp', {
            token: token
        });
    });

    $(document).on('click', '#infoGrp', function(e) {
        let info = '';
        let participants = chat.participants;
        for (pi in participants) {
            info += participants[pi] + '<br>';
        }
        info += 'Chat created by ' + chat.origin;
        infoModal('Groupmembers of Groupchat ' + chat.name, info);
    });

    $(document).on('click', '#addToGrp', function(e) {
        $('#modalList').empty();
        $('#modalHidden').val('addToGrp');
        let isAlreadyInGroup = false;
        for (ci in contacts) {
            isAlreadyInGroup = false;
            for (chp in chat.participants) {
                if (contacts[ci].name === chat.participants[chp]) {
                    isAlreadyInGroup = true;
                }
            }
            if (!isAlreadyInGroup) {
                appendContact(contacts[ci], 'modalList', true);
            }
        }
        $('#chatModal').modal('show');
    });

    function groupAdd(emitEvent) {
        let allCheckboxes = $('#modalList').find('.groupAddCheckbox');
        let grpContacts = [];
        for (c in allCheckboxes) {
            if (allCheckboxes[c].checked) {
                grpContacts.push(allCheckboxes[c].id);
            }
        }
        socket.emit(emitEvent, {
            name: emitEvent === 'group' ? $('#addGrpInput').val() : '',
            token: emitEvent === 'addToGrp' ? $('#tokenChat').val() : '',
            participants: grpContacts
        });
        $('#chatModal').modal('hide');
        $('#modalList').empty();
        $('#addGrpInput').val('');
    }

    // All contact functionalities

    function updateOnlineStatus(contact) {
        let color = contact.loggedIn === 1 ? 'green' : 'red';
        $('#' + contact.name).css("background-color", color);
    }

    function appendContact(contact, containerId, withCheckbox) {
        let name = contact.name || '',
            lastLogin = contact.lastLogin || '';
        if (name) {
            let content = '<li style="width:100%">' +
                '<div class="contact msj macro" ';
            content += 'id="' + name + '" >';
            content += '<div class="text text-l';
            content += '<p class="cntName">' + name + '</p>';
            content += lastLogin ? '<p class="lastOnline"><small>' + lastLogin + '</small></p>' : '';
            content += '</div>';
            if (withCheckbox) {
                content += '<div class="groupAdd cccButton">';
                content += '<input type="checkbox" class="form-check-input groupAddCheckbox" id="' + name + '"></div>';
            }
            content += '</li>';
            $("#" + containerId).append(content).scrollTop($("#" + containerId).prop('scrollHeight'));
        }
    }

    socket.on('allContacts', function(data) {
        $('#contacts').empty();
        contacts = data.contacts;
        contacts.forEach((contact) => {
            appendContact(contact, 'contacts', false);
			updateOnlineStatus(contact);
        });
    });

    socket.on('newContact', function(data) {
        contacts.push(data.contact);
        appendContact(data.contact, 'contacts', false);
		updateOnlineStatus(contact);
    });

    socket.on('statusContact', function(data) {
        updateOnlineStatus(data);
    });

    $(document).on('click', '.contact', function(e) {
        let contact = e.target.closest(".contact").id
        if (e.target.class !== 'groupAdd' && !e.target.closest(".groupAdd")) {
            socket.emit('openChat', {
                contact: contact
            });
        }
    });
});
