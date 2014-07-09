App = Ember.Application.create({
   LOG_TRANSITIONS: true
});

App.ApplicationAdapter = DS.LSAdapter.extend({
  namespace: 'sample'
});

App.Router.map(function() {
  this.resource('summary');
  
  this.resource('expenses', function() {
    this.resource('viewexpense', function() {
	  this.resource('eachexpense', {path: ':eachexpense_id' });
	});
	this.resource('addexpense', function() {
	  this.resource('expense', {path: ':exp_id'}, function() {
	    this.route('editexpense');
	  });
	  this.route('new');
	});
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

App.Expenditure = DS.Model.extend( {   
    desc      : DS.attr('string'),
	date      : DS.attr('date'),
	whopaid   : DS.hasMany('person'),
	amount    : DS.attr('string'),
	forwhom   : DS.hasMany('person')
});

Ember.RadioButton = Ember.View.extend({
  attributeBindings: ["isDisabled:disabled", "type", "name", "value"],
  classNames: ["ember-radio-button"],

  value: null,

  selectedValue: null,

  isDisabled: false,

  isChecked: false,

  tagName: "input",
  type: "radio",

  didInsertElement: function() {
    Ember.addObserver(this, 'isChecked', this, this.isCheckedDidChange);
    this.isCheckedDidChange();
  },

  willInsertElement: function() {
    Ember.removeObserver(this, 'isChecked', this, this.isCheckedDidChange);
  },

  selectedValueDidChange: Ember.observer(function() {
    set(this, 'isChecked', get(this, 'value') === get(this, 'selectedValue'));
  }, 'selectedValue'),

  isCheckedDidChange: function() {
    var isChecked = get(this, 'isChecked');

    this.$().prop('checked', isChecked ? 'checked' : null);

    if (isChecked) {
      set(this, 'selectedValue', get(this, 'value'));
    }
  },

  init: function() {
    this._super();
    this.selectedValueDidChange();
  },

  click: function() {
    Ember.run.once(this, this._updateElementValue);
  },

  _updateElementValue: function() {
    set(this, 'isChecked', this.$().prop('checked'));
  }

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
      this.get('store').find('model', lkqso).then(function(rec){
          rec.deleteRecord();
      });
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


// viewexpense

App.ViewexpenseRoute = Ember.Route.extend({
   model: function() {
     var expenses = this.get('store').findAll('expenditure');	
	 return expenses;
   }
});

App.EachexpenseRoute = Ember.Route.extend({
  model: function(params) {
    var store = this.get('store');
		return store.find('expenditure',params.exp_id);
  }
});

App.EachexpenseController = Ember.ObjectController.extend({
  isEditing: false,      
   
  edit: function() {
    this.set('isEditing', true);
  },

  doneEditing: function() {
    this.set('isEditing', false);
    this.get('store').commit();
  }
});

// addexpense

App.AddexpenseRoute = Ember.Route.extend({
   model: function(){  
      var expenses = this.get('store').findAll('expenditure');	  
	  return expenses;      
   }   
}); 

App.AddexpenseController = Ember.ArrayController.extend({
   sortProperties: ['amount'],
   sortAscending: true,
   
   expensesCount: function(){
      return this.get('model.length');
   }.property('@each') 
});

App.ExpenseRoute = Ember.Route.extend({
   model: function(params){      
        var store = this.get('store');
		return store.find('expenditure',params.exp_id);		     
   }
});

App.ExpenseController = Ember.ObjectController.extend({
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
         this.transitionToRoute('addexpense');        
         this.set('deleteMode', false);
      },
      edit: function(){
         this.transitionToRoute('expense.editexpense');
      }
   }
});

App.ExpenseEditexpenseRoute = Ember.Route.extend({
   model: function(){ 
      return this.modelFor('expense');
   }
});    

App.ExpenseEditexpenseController = Ember.ObjectController.extend({
   actions: {
       save: function(){
            var expense = this.get('model');
            expense.save();
            this.transitionToRoute('expense', expense);
       }
   }
});

App.AddexpenseNewRoute = Ember.Route.extend({
   model: function(){  
      var store = this.get('store');
		return store.createRecord('expenditure',this.get('model'));      
   },

   renderTemplate: function(){
      this.render('expense.editexpense', {
          controller: 'addexpenseNew'
      });
   }
});
        
App.AddexpenseNewController = Ember.ObjectController.extend({
    actions: {
        save: function () {       
			this.get('model').save();			            
            this.transitionToRoute('addexpense');
        }
    }
});






var showdown = new Showdown.converter();

Ember.Handlebars.helper('format-markdown', function(input) {
  return new Handlebars.SafeString(showdown.makeHtml(input));
});

Ember.Handlebars.helper('format-date', function(date) {
  return moment(date).fromNow();
});
