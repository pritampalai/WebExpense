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
	  this.resource('expense', {path: ':expense_id'}, function() {
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
    desc: DS.attr('string'),
	date: DS.attr('date'),
	whopaid: DS.attr('string'),
	amount: DS.attr('integer'),
	forwhom: DS.attr('string')
});

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
		return store.find('expenditure',params.expenditure_id);		     
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
            this.get('model').set('date', new Date());
			this.get('model').save();			            
            this.transitionToRoute('addexpense');
        }
    }
});






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










App.ViewexpenseRoute = Ember.Route.extend({
   model: function() {
     var expenses = this.get('store').findAll('expenditure');	
	 return expenses;
   }
});

App.EachexpenseRoute = Ember.Route.extend({
  model: function(params) {
    var store = this.get('store');
		return store.find('expenditure',params.expenditure_id);
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

var showdown = new Showdown.converter();

Ember.Handlebars.helper('format-markdown', function(input) {
  return new Handlebars.SafeString(showdown.makeHtml(input));
});

Ember.Handlebars.helper('format-date', function(date) {
  return moment(date).fromNow();
});
