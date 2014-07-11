App = Ember.Application.create({
   LOG_TRANSITIONS: true
});

App.ApplicationAdapter = DS.LSAdapter.extend({
  namespace: 'sample'
});

App.Router.map(function() {

  this.resource('summary');  
  this.resource('expenses', function() {
		this.resource('editexpense', { path: ':expense_id' });
  });
  this.resource('create', function() {
    this.resource('viewperson', function() {
      this.resource('eachuser', { path: ':eachuser_id' });
	});	
	this.resource('users', function() {
	  this.resource('user', {path: ':user_id'}, function() {
	    this.route('edit');
	  });
	  this.route('createuser');
	});  
  });
});

App.Person = DS.Model.extend( { 
    name         : DS.attr('string'),
    dname        : DS.attr('string'),
    desc         : DS.attr('string'),
	creationDate : DS.attr('date')           
});

App.Expense = DS.Model.extend( {   
    date: DS.attr('date'),
	description: DS.attr('string'),
	payer: DS.belongsTo('person'),
	amount: DS.attr('number'),
	payees: DS.hasMany('person', {async: true})
});

App.Summary = DS.Model.extend({
	name: DS.attr('string'),
	spent: DS.attr('number'),
	owes: DS.attr('number'),
	owed: DS.attr('number'),
	balance: DS.attr('number')
});

// viewperson 

App.ViewpersonRoute = Ember.Route.extend({
  model: function() {
    var users = this.get('store').findAll('person');	
	return users;
  }
});

App.EachuserRoute = Ember.Route.extend({
  model: function(params) {
    var store = this.get('store');
		return store.find('person',params.person_id);
  }
});

App.EachuserController = Ember.ObjectController.extend({
  isEditing: false,

  edit: function() {
    this.set('isEditing', true);
  },

  doneEditing: function() {
    this.set('isEditing', false);
    this.get('store').commit();
  }
});

// users

App.UsersRoute = Ember.Route.extend({
   model: function(){  
      var users = this.get('store').findAll('person');	  
	  return users;      
   }   
});

App.UsersController = Ember.ArrayController.extend({
   sortProperties: ['creationDate'],
   sortAscending: true,
      
   usersCount: function(){
      return this.get('model.length');
   }.property('@each')           
    
});

App.UserRoute = Ember.Route.extend({
   model: function(params){      
        var store = this.get('store');
		return store.find('person',params.person_id); 
		     
   }
});

App.UserController = Ember.ObjectController.extend({
   deleteMode: false,
           
   actions: {
      delete: function(){
         this.toggleProperty('deleteMode');
      },
      cancelDelete: function(){         
         this.set('deleteMode', false);
      },
      confirmDelete: function(){         
         this.get('model').deleteRecord();
         this.get('model').save();        
         this.transitionToRoute('users');        
         this.set('deleteMode', false);
      },
      edit: function(){
         this.transitionToRoute('user.edit');
      }
   }
});

App.UserEditRoute = Ember.Route.extend({
   model: function(){ 
      return this.modelFor('user');
   }
});    

App.UserEditController = Ember.ObjectController.extend({
   actions: {
       save: function(){
            var user = this.get('model');
            user.save();
            this.transitionToRoute('user', user);
       }
   }
});

App.UsersCreateuserRoute = Ember.Route.extend({
   model: function(){  
      var store = this.get('store');
		return store.createRecord('person',this.get('model'));      
   },

   renderTemplate: function(){
      this.render('user.edit', {
          controller: 'usersCreateuser'
      });
   }
});
        
App.UsersCreateuserController = Ember.ObjectController.extend({
    actions: {
        save: function () {    
            this.get('model').set('creationDate', new Date());
			this.get('model').save();			            
            this.transitionToRoute('users');
        }
    }
});

// EXPENSES


App.EditexpenseController = Ember.ObjectController.extend({
	needs: 'users',
	selectedPayer: '',
	selectedPayees: []
});

App.ExpenseController = Ember.ObjectController.extend({
	isChecked : false
});

App.ExpensesController = Ember.ArrayController.extend({
	content: [],
	needs: 'users',
	itemController: 'Expense',
	selectedPayer: '',
	selectedPayees: [],
//	compute the maximum id to generate the next id.
	expensesMaxId: function() {
		var lastRecord = this.get('model.length');
		if (lastRecord == 0)
			return 0;
		return ((this.objectAt(lastRecord - 1)).get('id'));
	}.property('@each'),
	actions: {

		//set the default values for all fields in the form
		setToDefault: function() {	
			this.set('expenseDate', new Date());
			this.set('description', '');
			this.set('selectedPayer', null);
			this.set('amount', '');
			this.set('selectedPayees', []);
		},


		close: function() {
			this.send("setToDefault");
			this.send("closeModal");
		},


		saveChanges: function(count) {
			var date = this.get('expenseDate');
			if(!date) 
				date = new Date();
                        var description = this.get('description');
	                var payerId = this.get('selectedPayer');		
			var amount = this.get('amount');
			var payees = this.get('selectedPayees');
		        var expense = this.store.createRecord('expense', {
				id: parseInt(count) + 1,
                                date: date,
                                description: description,
                                payer: null,
				amount: amount,
				payees: null
                        });

			var payerName;			
			var self = this; 
			this.store.find('person',payerId).then(function(payer) {
				expense.set('payer', payer);
				expense.save();
				self.send("updateSummaryPayer", payerId, payer.get('name'), payees.length, parseFloat(amount));
			});

			expense.get('payees').then(function(selectedPayees) {	
				payees.forEach(function(payeeId) {
					self.store.find('person', payeeId).then(function(payee) {			
						selectedPayees.addObject(payee);
						expense.set('payees', selectedPayees);
						expense.save();
						self.send("updateSummaryPayees", payeeId, payee.get('name'), payees.length, amount);
					});
				}, payees); 
			});

			this.send("setToDefault");
		},


		save: function(count) {
			this.send("saveChanges", count);
			this.send("close");
		},


		saveAndNew: function(count) {
			this.send("saveChanges", count);
		},	


		//update payer's 'Owed' and 'Balance' values in summary
		updateSummaryPayer: function(payerId, payerName, payeesCount, spentAmount) {
			//calculate the amount that the payer is owed (this is the amount spent)
			var owedAmount = spentAmount.toFixed(2);
			//if payer already present is summary, update the details
			if(this.store.getById('summary', payerId) != null) {
				this.store.find('summary', payerId).then(function(summaryRecord) {
					summaryRecord.set('spent', parseFloat(summaryRecord.get('spent')) + spentAmount);
					summaryRecord.set('owed', parseFloat(summaryRecord.get('owed')) + parseFloat(owedAmount));

					summaryRecord.set('balance', (parseFloat(summaryRecord.get('owed')) - parseFloat(summaryRecord.get('owes'))).toFixed(2));
					summaryRecord.save();
				});
			}

			//if payer not present in summary, create new record with details
			else {
				this.store.createRecord('summary', {
					id: payerId,
					name: payerName,
					spent: spentAmount,
					owes: 0,
					owed: parseFloat(owedAmount),
					balance: parseFloat(owedAmount)
				});
			}	
		},

		//update payees 'Owes' and 'Balance 'values in summary
		updateSummaryPayees: function(payeeId, payeeName, payeesCount, spentAmount) {
			//calculate the amount that the payee owes for the current expense
			var owesAmount = (parseFloat(spentAmount) / parseFloat(payeesCount)).toFixed(2);
			//if payee already present in summary report, update the details
			if(this.store.getById('summary', payeeId) != null) {
				this.store.find('summary', payeeId).then(function(summaryRecord) {
					summaryRecord.set('owes', parseFloat(summaryRecord.get('owes')) + parseFloat(owesAmount));
					summaryRecord.set('balance', (parseFloat(summaryRecord.get('owed')) - parseFloat(summaryRecord.get('owes'))).toFixed(2));
					summaryRecord.save();
				});
			}

			//if payee not present in summary, add new record with details
			else {
				this.store.createRecord('summary', {
					id: payeeId,
					name: payeeName,
					spent: 0,
					owes: parseFloat(owesAmount),
					owed: 0,
					balance: parseFloat(- owesAmount)
				});
			}
		},

		//delete selected records after confirmation and update summary details
		confirmDelete: function() {
		var toDelete = this.filterBy('isChecked', true);
		var self = this;
		toDelete.forEach(function(item) {
				var model = item.get('model');

				//use negative amount value to deduct from summary
			  	self.send("updateSummaryPayer", model.get('payer').get('id'), model.get('payer').get('name'), model.get('payees.length'), parseFloat(- model.get('amount')));

				var payees = model.get('payees');
				payees.forEach(function(payee) {
					self.send("updateSummaryPayees", payee.get('id'), payee.get('name'), model.get('payees.length'), parseFloat(- model.get('amount')));
				});

				//delete the expense record		
				model.deleteRecord();
				model.save();
			}, toDelete);
		this.send("close");
		}
	},
});

App.ExpensesRoute = Ember.Route.extend({
	actions: {
		addExpense: function() {
			this.render('newExpense', { into: 'expenses', outlet: 'modal', view: 'modal' });

		},
		deleteExpenses: function() {
			this.render('confirmDelete', { into: 'expenses', outlet: 'modal', view: 'modal' });
		},

		editExpense: function(expense) {
			this.transitionTo('editexpense', expense);
		},

		closeModal: function() {
                        this.disconnectOutlet({outlet: 'modal', parentView: 'expenses'});
                }
	},
	model: function() {
			return this.store.find("expense");
	},

	setupController: function(controller, model) {
		this._super(controller, model);
		this.controllerFor('users').set('content', this.store.find('person'));
		this.controllerFor('summary').set('content', this.store.find('summary'));
	}
});


App.EditexpenseRoute = Ember.Route.extend({

	amount: 0,
	payer: '',
	payees: [],
	payeesLength: 0,

	//save the original values before editing
	afterModel: function(expense) {
		amount = expense.get('amount');
		payer = expense.get('payer');
		payees = expense.get('payees');
		payeesLength = expense.get('payees.length');
	},
 
	//render the modal dialog form for editing the expense
	renderTemplate: function() {			
		this.render('editexpense', { into: 'expenses', outlet: 'modal', view: 'modal' });
	},


	actions: {
		//closes the modal dialog
		close: function() {

			this.controllerFor("editexpense").set('selectedPayer', '');

			//Temporary fix for payees checkboxes. They all appear unchecked.
			this.controllerFor("editexpense").set('selectedPayees', []);

                        this.disconnectOutlet({outlet: 'modal', parentView: 'expenses'});
			this.transitionTo('expenses');
                },

		 //commits the modified record
		 //First, delete the summary details associated with the expense and then save the edited expense and update the summary with the modified expense.
		 save: function() {
			var self = this;

			//delete the summary details associated with the expense by simply passing the negative original amount
			this.controllerFor("expenses").send("updateSummaryPayer", payer.get('id'), payer.get('name'), payeesLength, parseFloat(-amount));
			payees.forEach(function(payee) {
				self.controllerFor("expenses").send("updateSummaryPayees", payee.get('id'), payee.get('name'), payeesLength, parseFloat(-amount));
			});


			//Save the modified/edited record
                        var expense = this.currentModel;

			//convert to date type before saving
			var date = new Date(expense.get('date'));
			expense.set('date', date);

			var payerId = this.controllerFor("editexpense").get('selectedPayer');
			var selectPayees = this.controllerFor("editexpense").get('selectedPayees');

			//retrieve the corresponding person record from the selected 'Who paid?' id and save as payer.
			this.store.find('person',payerId).then(function(payer) {
				expense.set('payer', payer);
				expense.save();
				//update the summary's payer with the modified expense
				self.controllerFor("expenses").send("updateSummaryPayer", payerId, payer.get('name'), selectPayees.length, parseFloat(expense.get('amount')));
			});

			//retrieve the corresponding persons record from the checked 'For Whom?' ids and save as payees array.
			Em.RSVP.resolve(expense.get('payees')).then(function(payees) {
				//clear the existing values
				payees.clear();
				selectPayees.forEach(function(payeeId) {
					self.store.find('person', payeeId).then(function(payee) {			
						//add each checked person to payees array and save.
						payees.addObject(payee);
						expense.set('payees', payees);
						expense.save();
						//update the summary's payees with the modified expense details
						self.controllerFor("expenses").send("updateSummaryPayees", payeeId, payee.get('name'), selectPayees.length, parseFloat(expense.get('amount')));
					});
				}, selectPayees); 
			});

			//close the modal dialog after saving
                        this.send("close");
                },

	},

	model: function(params) {
		return this.store.find("expense", params.expense_id);
	}
});


App.SummaryRoute = Ember.Route.extend({

	model: function() {
		return this.store.find('summary');
	}

});

App.SummaryController = Ember.ArrayController.extend({
	content: [],
	itemController: 'summaryItem',
	payments: new Array(),
	isComputing: false,
	actions: {
		
		computePayments: function() {
			var owes = new Array();
			var owed = new Array();
			var payments = this.get('payments');
			this.get('model').forEach(function(summaryRecord) {
				var balance = parseFloat(summaryRecord.get('balance'));
				if(balance >= 0) {
					owed.push({id: summaryRecord.get('id'), name: summaryRecord.get('name'), bal: balance});
				}
				else {
					owes.push({id: summaryRecord.get('id'), name: summaryRecord.get('name'), bal: parseFloat(-balance)});
				}
			});
			owes.sort(function(a, b) {
				return -b.bal + a.bal;
			});

			owed.sort(function(a, b) {
				return b.bal - a.bal;
			});

			while (owes.filter(function(item) {
				if (item.bal > 0)
					return true;	
				}).length != 0) {
				var count = 0;
				var owesObj = owes[count];
				while (owesObj.bal == 0) 
					owesObj = owes[++ count];
				count = 0;
				var owedObj = owed[count];
				while (owedObj.bal == 0)
					owedObj = owed[++ count];
				var owesAmount = owesObj.bal;
				var owedAmount = owedObj.bal;
				if(owesAmount >= owedAmount) {
					owesObj.bal = owesAmount - owedAmount;
					owedObj.bal = 0;
					payments.push({owesId: owesObj.id, owesName: owesObj.name, owedId: owedObj.id, owedName: owedObj.name, amount: owedAmount});
				}
				else {
					owesObj.bal = 0;
					owedObj.bal = owedAmount - owesAmount;
					payments.push({owesId: owesObj.id, owesName: owesObj.name, owedId: owedObj.id, owedName: owedObj.name, amount: owesAmount});
				}
				if (owed.filter(function(item) {
					if(item.bal > 0)
						return true;
					}).length == 0)
					break;
			}
			this.set('payments', payments);
			this.set('isComputing', true);
		}
	}
});

App.SummaryItemController = Ember.ObjectController.extend({
	balanceColor: (function() {
		if(parseFloat(this.get('balance')) >= 0) 
			return "positive";
		else
			return "negative";
	}).property('balance')
});

Ember.Handlebars.registerBoundHelper('formatDate', function(date, format) {
	return moment(date).format(format);
});

App.DateField = Ember.TextField.extend({
	type: 'date',

	date: function(key, date) {
	    if (date) {
	      if (typeof date === "string")
		date = new Date(date);
	      this.set('value', date.toISOString().substring(0, 10));
	    } else {
	      value = this.get('value');
	      if (value) { 
		date = new Date(value);
	      } else {
		date = new Date();
	      	this.set('value', date.toISOString().substring(0, 10));
	      }
	    }
	    return date;
	}.property('value')
});

App.ModalView = Ember.View.extend({
	didInsertElement: function() {
		Ember.run.next(this, function()	{
			this.$('.modal, .modal-backdrop').addClass('in');
		});
	},
	layoutName: 'modal',
	actions: {
		close: function() {
			var view = this;
			this.$('.modal, .modal-backdrop').one("transitioned", function(ev) {
				view.controller.send('close');
			});
			this.$('.modal, .modal-backdrop').removeClass('in');
		}
	}
});

App.RadioButtonComponent = Ember.Component.extend({
	tagName: "input",
	type: "radio",
	attributeBindings: ["id", "name", "type", "value", "checked:checked" ],
	click: function() {
		this.set("selection", this.$().val());
	},
	checked: function() {

		//used in edit expenses to retrieve the model's payer id and select it
		if(!this.get("selection")) {
			var payer = this.get('parentView.targetObject').get('payer');
			//if payer is already set, (in case of editing)
			if(payer)
				this.set("selection", payer.id);
		}

		return this.get("value") === this.get("selection");
	}.property('selection')
});

Em.Handlebars.helper('radio-button', App.RadioButtonComponent);

App.CheckBoxComponent = Ember.Component.extend({
	tagName: "input",
	type: "checkbox",
	attributeBindings: ["id", "name", "type", "value", "checked:checked" ],
	click: function() {
		var checkedVals = this.get('checkedVals');
		if (checkedVals == null)
			checkedVals = [];
		checkedVals.addObject(this.$().val());
	},
	checked: function() {
		var checkedVals = this.get('checkedVals');
		if (checkedVals == null)
			return false;
		else 
			return checkedVals.contains(this.get("value")); 

	}.property('checkedVals')
});

Em.Handlebars.helper('check-box', App.CheckBoxComponent);




var showdown = new Showdown.converter();

Ember.Handlebars.helper('format-markdown', function(input) {
  return new Handlebars.SafeString(showdown.makeHtml(input));
});

Ember.Handlebars.helper('format-date', function(date) {
  return moment(date).fromNow();
});
