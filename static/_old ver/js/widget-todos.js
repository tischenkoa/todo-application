'used strict';

(function() {
	window.AppTodos = AppTodos;


	function AppTodos($rootTodosWidget) {
		this.$rootTodosWidget = $rootTodosWidget;
		this.view = new AppTodosView(this.$rootTodosWidget);
		this.model = new AppTodosModel(this.$rootTodosWidget);
		this.controller = new AppTodosController(this.view, this.model, this.$rootTodosWidget);
		this.controller.events(this);
		this.$rootTodosWidget.trigger('initTodosWidget', this.$rootTodosWidget);
	}

	function AppTodosView($rootTodosWidget) {
		this.$rootTodosWidget = $rootTodosWidget;
		this.panelEditTodoList = false;
	}


	AppTodosView.prototype.buildTodosWidget = function() {
		var todosTasksTableHead = ['Что нужно сделать', 'Когда', 'Селано'];
		var widgettodos = $('<div/>', {
			class: 'widget-todos clear-float'
		}).appendTo(this.$rootTodosWidget);
		$('<div/>', {
			class: "widget-todos-list-zone"
		}).appendTo(widgettodos);
		$('<div/>', {
			class: "widget-todos-tasks-zone"
		}).appendTo(widgettodos);
		$('<form/>', {
			class: "widget-todos-conteiner-filter"
		}).appendTo($('.widget-todos-list-zone', widgettodos));
		$('<input/>', {
			type: 'text',
			class: "widget-todos-filter",
			placeholder: "Фильтровать"
		}).appendTo($('.widget-todos-conteiner-filter', widgettodos));
		$('<button/>', {
			type: "reset",
			class: "widget-todos-conteiner-filter-button"
		}).appendTo($('.widget-todos-conteiner-filter', widgettodos));
		$('<div/>', {
			class: "widget-todos-list"
		}).appendTo($('.widget-todos-list-zone', widgettodos));
		$('<table/>', {
			class: "widget-container-list"
		}).appendTo($('.widget-todos-list', widgettodos));
		$('<button/>', {
			text: 'Новый список',
			class: "widget-todos-list-new"
		}).appendTo($('.widget-todos-list-zone', widgettodos));

		$('<div/>', {
			class: "widget-todos-header clear-float"
		}).appendTo($('.widget-todos-tasks-zone', widgettodos));
		$('<form/>', {
			class: "widget-todos-conteiner-filter"
		}).appendTo($('.widget-todos-header', widgettodos)).append(
			$('<input/>', {
				type: 'text',
				class: "widget-todos-filter",
				placeholder: "Фильтровать"
			}), $('<button/>', {
				type: "reset",
				class: "widget-todos-conteiner-filter-button"
			})
		);
		$('<div/>', {
			class: "widget-todos-conteiner-filter-completed"
		}).appendTo($('.widget-todos-header', widgettodos)).append(
			$('<input type="checkbox"><span>Выполненые</span>')
		);
		$('.widget-todos-tasks-zone', widgettodos).append($('<table/>', {
			class: 'widget-todos-tasks-head'
		}));

		var widgetTodosTasksTableHead = $('<thead/>').appendTo($('.widget-todos-tasks-head', widgettodos));

		var tasksHeadCell = $('<tr/>');
		$.each(todosTasksTableHead, function(myIndex, myData) {
			tasksHeadCell.append(
				$('<td/>', {
					text: myData
				})
			);
		});
		widgetTodosTasksTableHead.append(tasksHeadCell);

		$('.widget-todos-tasks-zone', widgettodos).append($('<div/>', {
			class: 'widget-todos-tasks'
		}));
		var widgetTodosTasksTableBody = $('<table/>').appendTo($('<tbody/>')).appendTo($('.widget-todos-tasks', widgettodos));

		var tasksBodyCell = $('<tr/>');
		$.each(todosTasksTableHead, function(myIndex, myData) {
			tasksBodyCell.append($('<td/>'));
		});
		widgetTodosTasksTableBody.append(tasksBodyCell);

		$('<button/>', {
			text: 'Добавить задачу',
			class: "widget-todos-task-new"
		}).appendTo($('.widget-todos-tasks-zone', widgettodos));

		this.$rootTodosWidget.trigger('buildTodosWidget');
	};

	AppTodosView.prototype.updateViewTodoList = function(todoList) {
		$('.widget-container-list', this.$rootTodosWidget).empty();
		todoList.forEach(function(item) {
			$('<tr/>').append($('<td/>', {
				text: item,
				class: "widget-item-list"
			})).appendTo($('.widget-container-list', this.$rootTodosWidget));
		});
	};

	AppTodosView.prototype.panelAddNewTodo = function() {
		this.panelEditTodoList = true;
		var $containerTodoList = $('.widget-container-list', this.$rootTodosWidget);
		$('<tr/>').append($('<td/>', {
			class: 'add-new-todo',
		})).appendTo($('tbody', $containerTodoList));

		var $addNewTodo = $('.add-new-todo', this.$rootTodosWidget);
		$addNewTodo.append($('<input>', {
			type: 'text',
			class: 'input-new-todo'
		}));
		$('input', $addNewTodo).focus();

		$addNewTodo.append($('<a>', {
			"href": "#",
			text: 'Save',
			class: 'control-new-todo save-new-todo'
		}));

		$addNewTodo.append($('<a>', {
			"href": "#",
			text: 'Cancel',
			class: 'control-new-todo cancel-new-todo'
		}));
	};



	AppTodosView.prototype.deleteNodeTodo = function($deleteNodeTodo) {
		$deleteNodeTodo.remove();
	};

	AppTodosView.prototype.panelEditTodo = function($nodePanelEdit) {
		var $editPanel = $('<div/>', {
			class: 'panel-edit-todo'
		});

		$('<a/>', {
			href: '#',
			class: 'rename-panel-edit-todo'
		}).append($('<img>', {
			src: '../images/rename.png'
		})).appendTo($editPanel);

		$('<a/>', {
			href: '#',
			class: 'remove-panel-edit-todo'
		}).append($('<img>', {
			src: '../images/remove.png'
		})).appendTo($editPanel);

		$editPanel.appendTo($nodePanelEdit);
	};

	AppTodosView.prototype.deletePanelEditTodo = function() {
		$('.panel-edit-todo', this.$rootTodosWidget).remove();
	};

	function AppTodosModel($rootTodosWidget) {
		this.$rootTodosWidget = $rootTodosWidget;
		this.todoList = [];
		this.tasks = {};
	}

	AppTodosModel.prototype.getTodoList = function() {
		var that = this;
		$.get('/todos', function(response) {
			that.todoList = response;
			that.$rootTodosWidget.trigger('uploadTodoList');
		});

	};

	AppTodosModel.prototype.addTodo = function(nameNewTodo) {
		var that = this;
		this.todoList.push(nameNewTodo);
		$.post('/todos/' + nameNewTodo, {
			todo: JSON.stringify({
				title: "" + nameNewTodo + " todo list",
				created: new Date().toString(),
				tasks: []
			})
		});
		that.$rootTodosWidget.trigger('uploadTodoList');

	};

	AppTodosModel.prototype.deleteTodo = function(deletedItemTodo) {
		var that = this;
		var indexDeletedItemTodo = $.inArray(deletedItemTodo, this.todoList);
		this.todoList.splice(indexDeletedItemTodo, 1);
		$.ajax({
			type: 'delete',
			url: '/todos/' + deletedItemTodo,
			success: function(res) {
				that.$rootTodosWidget.trigger('uploadTodoList');
				return console.log(res);
			}
		});
	};

	AppTodosModel.prototype.renameTodo = function() {

	};



	function AppTodosController(view, model, $rootTodosWidget) {
		this.view = view;
		this.model = model;
		this.$rootTodosWidget = $rootTodosWidget;
	}

	AppTodosController.prototype.events = function() {
		var that = this;
		that.$rootTodosWidget.on('initTodosWidget', function() {
			that.view.buildTodosWidget();
			that.model.getTodoList();
		});

		that.$rootTodosWidget.on('uploadTodoList', function() {
			that.view.updateViewTodoList(that.model.todoList);
		});

		that.$rootTodosWidget.on('click', '.widget-todos-list-new', function() {
			if (that.view.panelEditTodoList === false) {
				that.view.panelAddNewTodo();
			}
		});

		that.$rootTodosWidget.on('click', '.cancel-new-todo', function() {
			event.preventDefault();
			var deleteNodePanelEdit = $('.add-new-todo', that.$rootTodosWidget).parent();
			that.view.deleteNodeTodo(deleteNodePanelEdit);
			that.view.panelEditTodoList = false;
		});

		that.$rootTodosWidget.on('click', '.save-new-todo', function() {
			event.preventDefault();
			var nameNewTodo = $('.input-new-todo', that.$rootTodosWidget).val();
			if (nameNewTodo === '') {
				return;
			}
			that.model.addTodo(nameNewTodo);
			that.view.panelEditTodoList = false;
		});

		// Edit panel todo
		that.$rootTodosWidget.on('mouseenter', '.widget-item-list', function() {
			var eventItemList = event.target;
			that.view.panelEditTodo(eventItemList);


			$(eventItemList).on('mouseover', 'img', function() {
				$(event.target).stop().animate({
					opacity: '0.3'
				}, 60);
			});
			$(eventItemList).on('mouseout', 'img', function() {
				$(event.target).stop().animate({
					opacity: '1.0'
				}, 60);
			});

			$('.remove-panel-edit-todo').on('click', that.$rootTodosWidget, function() {
				event.preventDefault();
				var $deletedNodeItemTodo = $(event.target).closest('.widget-item-list');
				var deletedItemTodo = $deletedNodeItemTodo.text();
				that.model.deleteTodo(deletedItemTodo);
			});



		});

		that.$rootTodosWidget.on('mouseleave', '.widget-item-list', function() {
			var eventItemList = event.target;
			that.view.deletePanelEditTodo();
		});

		//hover edit panel todo tools


	};

})();