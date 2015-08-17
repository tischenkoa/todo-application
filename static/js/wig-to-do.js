'used strict';

(function() {
    function AppTodos($rootWigTodos) {
        this.$rootWigTodos = $rootWigTodos;
        this.mediator = new Mediator(this);
        this.model = new Model(this.mediator);
        this.view = new View(this.mediator);
        this._init();
    }

    AppTodos.prototype._init = function() {
        // create html wiget from pattern (handlebars)
        // ****code****
        // load tasks List from server
        this.mediator.publish('getTasksList');
    };

    function Model(mediator) {
        var that = this;
        this.mediator = mediator;

        this.mediator.subscribe('getTasksList', function() {
            that.getTasksList();
        });

        this.mediator.subscribe('addNewTasks', function(nameTasks) {
            that.addNewTasks(nameTasks);
        });

        this.mediator.subscribe('addNewTask', function(task) {
            that.addNewTask(task);
        });

        this.mediator.subscribe('getTasks', function(indexTasks) {
            that.getTasks(indexTasks);
        });

        this.mediator.subscribe('removeTasks', function(indexTasks) {
            that.removeTasks(indexTasks);
        });

        this.mediator.subscribe('editTask', function(paramEdit) {
            that.editTask(paramEdit);
        });

        this.mediator.subscribe('renameTasks', function(indexTasks) {
            that.renameTasks(indexTasks);
        });

    }

    Model.prototype.getTasksList = function() {
        var that = this;
        $.get('/todos', function(response) {
            that.tasksList = response;
            that.mediator.publish('loadTasksList');
        });
    };

    Model.prototype.addNewTasks = function(nameTasks) {
        var that = this;
        $.post('/todos/' + nameTasks, {
            todo: JSON.stringify({
                title: "" + nameTasks + " task list",
                created: new Date().toGMTString(),
                tasks: []
            })
        }, function() {
            that.tasksList.push(nameTasks);
            that.mediator.publish('hideFormAddNewTasks');
            that.mediator.publish('addItemTasksToViewList', nameTasks);
        });
    };

    Model.prototype.addNewTask = function(newTask) {
        var that = this;
        var whereDataFormatJsGMT = moment(newTask.where, "YYYY/MM/DD, HH:mm").toDate().toGMTString();
        this.tasks.tasks.push({
            description: newTask.name,
            where: whereDataFormatJsGMT,
            done: false
        });

        $.ajax({
            url: '/todos/' + this.nameloadTasks,
            method: 'PUT',
            data: {
                todo: JSON.stringify(this.tasks)
            },
            success: function() {
                that.mediator.publish('hideFormAddTask');
                that.mediator.publish('addItemTaskToView', that.tasks.tasks[that.tasks.tasks.length - 1]);

            },
            error: function() {
                that.tasks.tasks.pop();
            }
        });
    };

    Model.prototype.getTasks = function(index) {
        var that = this;
        var nameTasks = this.tasksList[index];
        this.nameloadTasks = nameTasks;
        $.get('/todos/' + nameTasks, function(response) {
            that.tasks = response;
            that.mediator.publish('updateTasks');
        });
    };

    Model.prototype.removeTasks = function(index) {
        var that = this;
        var nameTasks = this.tasksList[index];
        // this.nameloadTasks

        $.ajax({
            url: '/todos/' + nameTasks,
            method: 'delete',
            success: function() {
                that.tasksList.splice(index, 1);
                that.mediator.publish('removeVeiwTasksList', index);
            },
        });

    };

    Model.prototype.editTask = function(paramEdit) {
        var that = this;
        var copyRemoveTask;

        if (paramEdit.typeEdit === 'remove') {
            copyRemoveTask = this.tasks.tasks.splice(paramEdit.indexTask, 1);
        }

        if (paramEdit.typeEdit === 'toggleDone') {
            copyRemoveTask = this.tasks.tasks[paramEdit.indexTask];
            if (this.tasks.tasks[paramEdit.indexTask].done) {
                this.tasks.tasks[paramEdit.indexTask].done = false;
            } else this.tasks.tasks[paramEdit.indexTask].done = true;
        }

        if (paramEdit.typeEdit === 'update') {
            copyRemoveTask = this.tasks.tasks[paramEdit.indexTask];
            this.tasks.tasks[paramEdit.indexTask].description = paramEdit.newNameTask;
            this.tasks.tasks[paramEdit.indexTask].where = paramEdit.newWhereTask;
            this.tasks.tasks[paramEdit.indexTask].done = false;
        }

        $.ajax({
            url: '/todos/' + that.nameloadTasks,
            method: 'PUT',
            data: {
                todo: JSON.stringify(that.tasks)
            },
            success: function() {

                if (paramEdit.typeEdit === 'remove')
                    that.mediator.publish('removeVeiwTasks', paramEdit.indexTask);

                if (paramEdit.typeEdit === 'toggleDone' || 'update') {
                    that.mediator.publish('updateViewTask', {
                        indexTask: paramEdit.indexTask,
                        task: that.tasks.tasks[paramEdit.indexTask]
                    });
                }
            },
            error: function() {

                if (paramEdit.typeEdit === 'remove')
                    that.tasks.tasks.splice(index, 0, copyRemoveTask);

                if (paramEdit.typeEdit === 'toggleDone' || 'update')
                    that.tasks.tasks[paramEdit.indexTask] = copyRemoveTask;

            }
        });

    };

    Model.prototype.renameTasks = function(parameter) {
        var that = this;
        var nameTasks = this.tasksList[parameter.indexTasks];

        $.get('/todos/' + nameTasks).then(function jhguighui(todoList) {
            $.post('/todos/' + parameter.newNameTasks, {
                todo: JSON.stringify({
                    title: todoList.title,
                    created: todoList.created,
                    tasks: todoList.tasks
                })
            });
        }).then(function() {
            $.ajax({
                url: '/todos/' + nameTasks,
                method: 'delete'
            });
        }).then(function() {
            that.tasksList[parameter.indexTasks] = parameter.newNameTasks;
            that.mediator.publish('renameViewTasks', parameter);
        });
    };



    function View(mediator) {
        var that = this;
        var KEY_CODE_ENTER = 13;
        this.mediator = mediator;
        this.$rootWigTodos = this.mediator.app.$rootWigTodos;

        this.$tasksList = $('.to-do-list tbody', this.$rootWigTodos);
        this.$viewPortTasksList = $('.to-do-list', this.$rootWigTodos);
        this.$tasks = $('.to-do-tasks tbody', this.$rootWigTodos);
        this.$viewPortTasks = $('.to-do-tasks', this.$rootWigTodos);
        this.$listTodo = $('.to-do-list tbody, .to-do-tasks tbody', this.$rootWigTodos);
        this.$buttonShowInputAddNewTasks = $('.to-do-add-new-tasks', this.$rootWigTodos);
        this.$buttonShowInputAddNewTask = $('.to-do-add-task', this.$rootWigTodos);


        this.mediator.subscribe('loadTasksList', function() {
            that.$buttonShowInputAddNewTasks.attr("disabled", false);
        });

        this.mediator.subscribe('updateTasks', function() {
            that.$buttonShowInputAddNewTask.attr("disabled", false);
        });

        this.mediator.subscribe('removeVeiwTasksList', function(parameter) {
            that.removeVeiwTasksList(parameter);
        });

        this.mediator.subscribe('removeVeiwTasks', function(parameter) {
            that.removeVeiwTasks(parameter);
        });

        this.mediator.subscribe('renameViewTasks', function(parameter) {
            that.renameViewTasks(parameter);
        });

        this.mediator.subscribe('addItemTasksToViewList', function(item) {
            that.addItemTasks(item);
        });

        this.mediator.subscribe('addItemTaskToView', function(item) {
            that.addItemTask(item);
        });

        this.mediator.subscribe('updateViewTask', function(paramUpdate) {
            that.updateViewTask(paramUpdate);
        });

        this.mediator.subscribe('hideFormAddNewTasks', function() {
            that.hideFormAddNewTasks();
        });

        this.mediator.subscribe('hideFormAddTask', function() {
            that.hideFormAddTask();
        });


        this.$buttonShowInputAddNewTasks.on('click', function() {
            if ($('.form-add-new-tasks', this.$tasksList).length > 0) return;
            that.formAddNewTasks();
            var $buttonAddNewTasks = $('.add-new-tasks', this.$rootWigTodos);
            var $buttonHideInputAddNewTasks = $('.to-do-hide-input-add-new-tasks', this.$rootWigTodos);
            var $inputNameNewTasks = $('.input-name-new-tasks', this.$rootWigTodos);


            that.$viewPortTasksList.animate({
                scrollTop: that.$viewPortTasksList[0].scrollHeight
            }, 1200);

            $buttonAddNewTasks.on('click', function() {
                if ($inputNameNewTasks.val().length > 0) {
                    that.mediator.publish('addNewTasks', $inputNameNewTasks.val());
                }
            });

            $buttonHideInputAddNewTasks.on('click', function() {
                that.mediator.publish('hideFormAddNewTasks');
            });

            $inputNameNewTasks.focus();

            $inputNameNewTasks.on('keydown', function(event) {
                if (event.keyCode === KEY_CODE_ENTER) $buttonAddNewTasks.trigger('click');
            });
        });

        this.$buttonShowInputAddNewTask.on('click', function() {
            if ($('.form-add-task', this.$tasks).length > 0) return;
            that.formAddNewTask();
            var $buttonAddNewTask = $('.add-new-task', this.$rootWigTodos);
            var $buttonHideInputAddTask = $('.to-do-hide-input-add-task', this.$rootWigTodos);
            var $inputNameTask = $('.input-name-new-task', this.$rootWigTodos);
            var $inputWhereTask = $('.input-where-task', this.$rootWigTodos);
            var $checkBoxDoneTask = $('.check-box-done-task', this.$rootWigTodos);


            that.$viewPortTasks.animate({
                scrollTop: that.$viewPortTasks[0].scrollHeight
            }, 1200);

            $buttonAddNewTask.on('click', function() {
                if ($inputNameTask.val().length > 0) {
                    var task = {
                        name: $inputNameTask.val(),
                        where: $inputWhereTask.val()
                    };
                    that.mediator.publish('addNewTask', task);
                }
            });

            $buttonHideInputAddTask.on('click', function() {
                that.mediator.publish('hideFormAddTask');
            });

            $inputNameTask.focus();

            $('input', '.form-add-task').on('keydown', function(event) {
                if (event.keyCode === KEY_CODE_ENTER) $buttonAddNewTask.trigger('click');
            });

            $('#datetimepicker').datetimepicker({
                format: "Y/m/d, H:i",
                value: new Date()
            });
        });

        this.$tasksList.on('click', function(event) {
            var $eventTarget = $(event.target);
            var $selectTasks = $eventTarget.closest('tr', this.$tasksList);

            if ($selectTasks.hasClass('form-add-new-tasks')) return;

            var index = $('tr', that.$tasksList).index($selectTasks);

            if ($eventTarget.closest('.button-edit-task', this.$tasksList).length > 0) {
                var parameter = {};
                parameter.value = $('td', $selectTasks).text();
                parameter.destination = $selectTasks;
                that.formAddNewTasks(parameter);

                $('.input-name-new-tasks', that.$tasksList).focus();

                $('.add-new-tasks', that.$tasksList).on('click', function() {
                    parameter.indexTasks = index;
                    parameter.newNameTasks = $('.input-name-new-tasks', that.$tasksList).val();
                    $(parameter.destination).show();
                    $('.form-add-new-tasks', that.$tasksList).remove();
                    that.mediator.publish('renameTasks', parameter);
                });

                $('.to-do-hide-input-add-new-tasks', that.$tasksList).on('click', function() {
                    $(parameter.destination).show();
                    $('.form-add-new-tasks', that.$tasksList).remove();
                });

                $('.input-name-new-tasks', that.$tasksList).on('keydown', function(event) {
                    if (event.keyCode === KEY_CODE_ENTER) $('.add-new-tasks', that.$tasksList).trigger('click');
                });
                return;
            }

            if ($eventTarget.closest('.button-remove-task', this.$tasksList).length > 0) {
                that.mediator.publish('removeTasks', index);
                return;
            }
            $('tr', that.$tasksList).removeClass('select-tasks');
            $selectTasks.addClass('select-tasks');

            $('.to-do-filter-task', that.$rootWigTodos).val('');
            $('.check-box-show-done-task', that.$rootWigTodos).prop("checked", true);

            that.mediator.publish('getTasks', index);
        });


        this.$tasks.on('click', function(event) {
            var $eventTarget = $(event.target);
            var $selectTask = $eventTarget.closest('tr', this.$tasks);

            if ($selectTask.hasClass('form-add-task')) return;

            var index = $('tr', that.$tasks).index($selectTask);

            if ($eventTarget.closest('.button-edit-task', this.$tasks).length > 0) {
                var parameter = {};
                parameter.currentNameTask = $('.task-name', $selectTask).text();
                parameter.currentWhereTask = $('.task-where', $selectTask).text();
                parameter.destination = $selectTask;
                that.formAddNewTask(parameter);
                $('#datetimepicker').datetimepicker({
                    format: "Y/m/d, H:i"
                });

                $('.input-name-new-task', that.$tasks).focus();

                $('.add-new-task', this.$tasks).on('click', function() {
                    parameter.typeEdit = 'update';
                    parameter.indexTask = index;
                    parameter.newNameTask = $('.input-name-new-task', that.$tasks).val();
                    parameter.newWhereTask = $('.input-where-task', that.$tasks).val();
                    $('.form-add-task', that.$tasks).remove();
                    that.mediator.publish('editTask', parameter);
                    $(parameter.destination).show();
                });

                $('.to-do-hide-input-add-task', this.$tasks).on('click', function() {
                    $(parameter.destination).show();
                    $('.form-add-task', that.$tasks).remove();
                });

                $('input', that.$tasks).on('keydown', function(event) {
                    if (event.keyCode === KEY_CODE_ENTER) $$('.add-new-task', this.$tasks).trigger('click');
                });

                return;
            }

            if ($eventTarget.closest('.button-remove-task', this.$tasks).length > 0) {
                that.mediator.publish('editTask', {
                    indexTask: index,
                    typeEdit: 'remove'
                });
                return;
            }

            if ($eventTarget.closest('.table-task-do', this.$tasksList).length > 0) {
                that.mediator.publish('editTask', {
                    indexTask: index,
                    typeEdit: 'toggleDone'
                });
                return;
            }
        });


        this.$listTodo.on('mouseover', function(event) {
            if ($('.form-add-new-tasks, .form-add-task', this.$tasksList).length !== 0) return;
            var _eventTask = $(event.target).closest('tr');
            if (_eventTask.hasClass('hover')) return;
            _eventTask.addClass('hover');

            if (!this.templateButtonEditTask) {
                var templateScript = $('.template-buttons-edit-task').html();
                var template = Handlebars.compile(templateScript);
                this.templateButtonEditTask = template();
            }

            $($('td', _eventTask)[0]).append(this.templateButtonEditTask);
        });

        this.$listTodo.on('mouseout', function(event) {
            var _eventTask = $(event.target).closest('tr', this.$tasksList);
            var _relatedeventTask = $(event.relatedTarget).closest('tr', this.$tasksList);
            if (_eventTask.hasClass('hover') && _relatedeventTask.hasClass('hover')) return;
            $('.buttons-edit-task', _eventTask).remove();
            _eventTask.removeClass('hover');
        });

        $('.filter-todo', this.$rootWigTodos).on('keyup change', 'input', function(event) {
            var $eventTarget = $(event.target);
            var filterText;
            var showDoneTask;
            var filterElement;

            if ($eventTarget.hasClass('check-box-show-done-task') || $eventTarget.hasClass('to-do-filter-task')) {
                filterText = $('.to-do-filter-task', that.$rootWigTodos).val();
                showDoneTask = $('.check-box-show-done-task', that.$rootWigTodos).prop("checked");
                filterElement = that.$tasks.children();

                filterElement.show();


                if (!showDoneTask) {
                    $('.task-done-true', that.$tasks).hide();
                }

                that.filter(filterText, filterElement, 0);
                return;
            }

            if ($eventTarget.hasClass('to-do-filter-list')) {
                filterText = $('.to-do-filter-list', that.$rootWigTodos).val();
                filterElement = that.$tasksList.children();

                filterElement.show();

                that.filter(filterText, filterElement, 0);
                return;

            }
        });


        $('.to-do-tasks thead', this.$rootWigTodos).on('click', function(event) {
            var elemTheadSort = $(event.target).closest('td');
            var indexCol = $('.to-do-tasks thead td', that.$rootWigTodos).index(elemTheadSort);
            var typeSort;
            var ascSort = true;

            if ($(elemTheadSort).hasClass('ascendant-sort') || $(elemTheadSort).hasClass('descendant-sort')) {
                $(elemTheadSort).toggleClass('ascendant-sort');
                $(elemTheadSort).toggleClass('descendant-sort');
            } else {
                $('.to-do-tasks thead td', that.$rootWigTodos).removeClass('ascendant-sort').removeClass('descendant-sort');
                $(elemTheadSort).addClass('ascendant-sort');
            }

            if ($(elemTheadSort).hasClass('descendant-sort')) ascSort = false;

            if ($(elemTheadSort).hasClass('table-tasks-col-where')) {
                typeSort = 'date';
            } else if ($(elemTheadSort).hasClass('table-tasks-col-do')) {
                typeSort = 'boolean';
            } else {
                typeSort = 'string';
            }

            that.sort(that.$tasks, indexCol, ascSort, typeSort);
        });
    }

    View.prototype.sort = function($tableSort, indexCol, ascSort, typeSort) {
        var $rowsSortTable = $('.to-do-tasks tbody tr', this.$rootWigTodos);

        // 
        $rowsSortTable.sort(function(a, b) {
            var valueA;
            var valueB;
            
            if (typeSort === 'boolean') {
                if ($(a).hasClass('task-done-true')) valueA = true;
                else valueA = false;
                if ($(b).hasClass('task-done-true')) valueB = true;
                else valueB = false;
            } else {
                valueA = $($('td', a)[indexCol]).text();
                valueB = $($('td', b)[indexCol]).text();
            }

            if (ascSort) {
                return (valueA > valueB) ? 1 : -1;
            } else {
                return (valueA > valueB) ? -1 : 1;
            }
        });

        $rowsSortTable.each(function(index, row) {
            $tableSort.append(row);
        });
    };

    View.prototype.filter = function(filterText, filterElement, filterCol) {
        var textElement;
        filterElement.each(function(index, row) {
            textElement = $($(row).children()[filterCol]).text();
            if (textElement.indexOf(filterText) === -1)
                $(row).hide();
        });

    };



    View.prototype.addItemTasks = function(nameTasks) {
        $('<tr/>').append($('<td/>', {
            text: nameTasks
        })).appendTo(this.$tasksList);

        $('.to-do-filter-list', this.$rootWigTodos).trigger('change');
    };

    View.prototype.removeVeiwTasksList = function(parameter) {
        if (parameter === 'removeAll') {
            this.$tasksList.empty();
            return;
        }
        var removeTasks = this.$tasksList.children()[parameter];
        if ($(removeTasks).hasClass('select-tasks')) {
            this.$tasks.empty();
            this.$buttonShowInputAddNewTask.attr("disabled", true);
        }
        removeTasks.remove();
    };

    View.prototype.removeVeiwTasks = function(parameter) {
        if (parameter === 'removeAll') {
            this.$tasks.empty();
            return;
        }

        this.$tasks.children()[parameter].remove();
    };


    View.prototype.renameViewTasks = function(parameter) {
        $('td', parameter.destination).text(parameter.newNameTasks);
        $('.to-do-filter-list', this.$rootWigTodos).trigger('change');
    };

    View.prototype.formAddNewTasks = function(param) {
        var parameter = param || {};
        if (!this.templateFormAddNewTasks) {
            var templateScript = $('.template-form-add-new-tasks').html();
            this.templateFormAddNewTasks = Handlebars.compile(templateScript);
        }

        if (parameter.destination) {
            $(parameter.destination).add('rename-tasks');
            $(parameter.destination).hide();
            $(parameter.destination).after(this.templateFormAddNewTasks(parameter));
            return;
        }
        this.$tasksList.append(this.templateFormAddNewTasks(parameter));
    };

    View.prototype.formAddNewTask = function(param) {
        var parameter = param || {};
        if (!this.templateFormAddNewTask) {
            var templateScript = $('.template-form-add-new-task').html();
            this.templateFormAddNewTask = Handlebars.compile(templateScript);
        }

        if (parameter.destination) {
            $(parameter.destination).add('rename-tasks');
            $(parameter.destination).hide();
            $(parameter.destination).after(this.templateFormAddNewTask(parameter));
            return;
        }
        this.$tasks.append(this.templateFormAddNewTask);
    };

    View.prototype.hideFormAddNewTasks = function() {
        $('.form-add-new-tasks', this.$rootWigTodos).remove();
    };

    View.prototype.hideFormAddTask = function() {
        $('.form-add-task', this.$rootWigTodos).remove();
    };

    View.prototype.addItemTask = function(item) {
        if (!this.templateNewTask) {
            var templateScript = $('.template-new-task').html();
            this.templateNewTask = Handlebars.compile(templateScript);
        }
        var formatedItem = {};
        var date = new Date(item.where);
        formatedItem.where = moment(date).format("YYYY/MM/DD, HH:mm");
        formatedItem.description = item.description;
        formatedItem.done = item.done;
        var template = this.templateNewTask(formatedItem);
        this.$tasks.append(template);
        $('.to-do-filter-task', this.$rootWigTodos).trigger('change');
    };

    View.prototype.updateViewTask = function(paramUpdateTask) {
        var elemUpdateTask = this.$tasks.children()[paramUpdateTask.indexTask];
        var date = new Date(paramUpdateTask.task.where);
        var formatedWhere = moment(date).format("YYYY/MM/DD, HH:mm");

        $('.task-name', elemUpdateTask).text(paramUpdateTask.task.description);
        $('.task-where', elemUpdateTask).text(formatedWhere);
        if (paramUpdateTask.task.done) {
            $(elemUpdateTask).addClass('task-done-true');
        } else {
            $(elemUpdateTask).removeClass('task-done-true');
        }

        $('.to-do-filter-task', this.$rootWigTodos).trigger('change');
    };



    function Mediator(app) {
        var that = this;
        this.events = {};
        this.app = app;

        this.subscribe('loadTasksList', function() {
            that.publish('removeVeiwTasksList', 'removeAll');
            that.app.model.tasksList.forEach(function(item) {
                that.publish('addItemTasksToViewList', item);
            });
        });

        this.subscribe('updateTasks', function() {
            that.publish('removeVeiwTasks', 'removeAll');
            that.app.model.tasks.tasks.forEach(function(item) {
                that.publish('addItemTaskToView', item);
            });
        });
    }

    Mediator.prototype.subscribe = function(event_name, callback) {
        if (!this.events[event_name]) {
            this.events[event_name] = [];
        }
        this.events[event_name].push(callback);
    };
    Mediator.prototype.unsubscribe = function(event_name, callback_) {
        if (arguments.length === 1) {
            delete this.events[event_name];
        } else {
            if (this.events[event_name]) {
                this.events[event_name] = this.events[event_name].filter(function(callback) {
                    return callback !== callback_;
                });
            }
        }
    };
    Mediator.prototype.publish = function(event_name, data) {
        var callbacks;
        var i;

        callbacks = this.events[event_name];
        if (callbacks && callbacks.length) {
            for (i = 0; i < callbacks.length; i += 1) {
                callbacks[i].call(undefined, data);
            }
        }
    };

    // var applicationTodo = new AppTodos($('.wig-to-do'));

    window.AppTodos = AppTodos;
})();
