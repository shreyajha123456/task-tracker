  // ----- TASK MANAGER (modern persistent, smooth edit) -----
  // store tasks: each = { id, text, completed }
  let tasks = [];

  // DOM elements
  const incompleteUl = document.getElementById("incomplete-tasks");
  const completedUl = document.getElementById("completed-tasks");
  const taskInput = document.getElementById("new-task");
  const addBtn = document.getElementById("addTaskBtn");
  const clearCompletedBtn = document.getElementById("clearCompletedBtn");
  const pendingBadge = document.getElementById("pendingCountBadge");

  // ---------- Helper: save to localStorage ----------
  function saveToLocalStorage() {
    localStorage.setItem("flowTasks_data", JSON.stringify(tasks));
  }

  // ---------- Load from localStorage ----------
  function loadFromLocalStorage() {
    const stored = localStorage.getItem("flowTasks_data");
    if (stored) {
      try {
        tasks = JSON.parse(stored);
        // validation: ensure each task has required fields
        if (!Array.isArray(tasks)) tasks = [];
        tasks = tasks.filter(t => t && typeof t.text === 'string' && typeof t.completed === 'boolean' && t.id);
      } catch(e) { tasks = []; }
    }
    if (!tasks.length) {
      // friendly demo tasks
      tasks = [
        { id: Date.now() + 1, text: "✨ Explore modern task tracker", completed: false },
        { id: Date.now() + 2, text: "🎯 Click edit to rename me", completed: false },
        { id: Date.now() + 3, text: "✅ Complete tasks & move them", completed: true },
        { id: Date.now() + 4, text: "🗑️ Delete or clear completed", completed: false }
      ];
    }
  }

  // ---------- Render the whole UI based on tasks array ----------
  function render() {
    // clear lists
    incompleteUl.innerHTML = '';
    completedUl.innerHTML = '';

    let pendingCount = 0;

    tasks.forEach(task => {
      const taskElement = createTaskElement(task);
      if (task.completed) {
        completedUl.appendChild(taskElement);
      } else {
        incompleteUl.appendChild(taskElement);
        pendingCount++;
      }
    });

    // empty states
    if (incompleteUl.children.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'empty-message';
      emptyMsg.innerHTML = '<i class="far fa-smile-wink"></i> Nothing here — add a fresh task!';
      incompleteUl.appendChild(emptyMsg);
    }
    if (completedUl.children.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'empty-message';
      emptyMsg.innerHTML = '<i class="fas fa-check-circle"></i> Completed tasks will appear here';
      completedUl.appendChild(emptyMsg);
    }

    // update pending badge
    pendingBadge.textContent = pendingCount;
    saveToLocalStorage();
  }

  // ---- Create DOM element from task object with improved edit & delete & checkbox (modern interaction)----
  function createTaskElement(task) {
    const li = document.createElement('li');
    li.dataset.id = task.id;

    // checkbox
    const checkBox = document.createElement('input');
    checkBox.type = 'checkbox';
    checkBox.checked = task.completed;
    // label for text
    const label = document.createElement('label');
    label.textContent = task.text;
    // hidden edit input (inline)
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.value = task.text;

    // action buttons container
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn edit';
    editBtn.innerHTML = '<i class="fas fa-pen"></i> Edit';
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn delete';
    deleteBtn.innerHTML = '<i class="fas fa-trash-can"></i> Delete';

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);
    li.appendChild(checkBox);
    li.appendChild(label);
    li.appendChild(editInput);
    li.appendChild(actionsDiv);

    // ---- Event: Checkbox toggle (complete / incomplete) ----
    checkBox.addEventListener('change', (e) => {
      e.stopPropagation();
      // update task completed status
      task.completed = checkBox.checked;
      // re-render cleanly (preserves data, smooth transition)
      render();
    });

    // ---- DELETE task ----
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // remove from tasks array by id
      tasks = tasks.filter(t => t.id !== task.id);
      render();
    });

    // ---- improved EDIT behavior: modern + intuitive ----
    // We'll manage .editMode class and use edit + save concept with Enter key support
    // Also the edit button becomes "Save" when editing, and updates the task text
    let isEditMode = false;

    // function to enter edit mode
    function enterEditMode() {
      if (isEditMode) return;
      isEditMode = true;
      li.classList.add('editMode');
      editInput.value = label.textContent;
      editInput.focus();
      editBtn.innerHTML = '<i class="fas fa-save"></i> Save';
      // select all text for easy editing
      editInput.select();
    }

    function exitEditModeAndSave() {
      if (!isEditMode) return;
      const newValue = editInput.value.trim();
      if (newValue !== "") {
        // update task text in data
        task.text = newValue;
        label.textContent = newValue;
        // re-render only that change but we also need to keep consistency
        // we can call render to refresh badge and ordering? but we can avoid full render for smoothness
        // however editing should update tasks array, then re-render will keep correct sorting 
        // but it would remove edit mode, which is fine after saving. Better to call render to sync everything.
        // But full render will rebuild list and preserve data, good.
        tasks = tasks.map(t => t.id === task.id ? { ...t, text: newValue } : t);
        render();
      } else {
        // if empty, restore previous label
        editInput.value = label.textContent;
        li.classList.remove('editMode');
        editBtn.innerHTML = '<i class="fas fa-pen"></i> Edit';
        isEditMode = false;
        // revert no changes
      }
    }

    function cancelEditMode() {
      if (!isEditMode) return;
      li.classList.remove('editMode');
      editBtn.innerHTML = '<i class="fas fa-pen"></i> Edit';
      isEditMode = false;
      editInput.value = label.textContent;
    }

    // edit button click: toggle behaviour
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!isEditMode) {
        enterEditMode();
      } else {
        exitEditModeAndSave();
      }
    });

    // on pressing Enter inside edit input -> save and exit
    editInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (isEditMode) {
          exitEditModeAndSave();
        }
      }
    });
    // on blur: if in edit mode -> save automatically (user friendly)
    editInput.addEventListener('blur', () => {
      if (isEditMode) {
        exitEditModeAndSave();
      }
    });

    // additional helper: avoid double event if rerender happens during blur, but safe
    return li;
  }

  // ----- ADD new task -----
  function addNewTask() {
    let newTaskText = taskInput.value.trim();
    if (newTaskText === "") {
      // gentle shake feedback (optional)
      taskInput.style.borderColor = "#e07c7c";
      setTimeout(() => { taskInput.style.borderColor = "#cbdfe8"; }, 600);
      return;
    }
    const newTask = {
      id: Date.now(),
      text: newTaskText,
      completed: false,
    };
    tasks.push(newTask);
    render();
    taskInput.value = "";
    taskInput.focus();
  }

  // Clear completed tasks
  function clearCompletedTasks() {
    tasks = tasks.filter(task => !task.completed);
    render();
  }

  // Helper for add button + Enter key
  addBtn.addEventListener('click', addNewTask);
  taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addNewTask();
    }
  });

  // clear completed button
  clearCompletedBtn.addEventListener('click', clearCompletedTasks);

  // ---- INITIALIZE app ----
  loadFromLocalStorage();
  render();
  
  // additional small animation: interactive placeholder effect
  taskInput.addEventListener('focus', () => {
    taskInput.parentElement.style.transform = 'scale(1.01)';
  });
  taskInput.addEventListener('blur', () => {
    taskInput.parentElement.style.transform = 'scale(1)';
  });

  // optional: a small shortcut for demo / modern feeling (double click on empty badge ? no thanks)
  // ensure everything is persistent after each action, render already calls save
  console.log("🔥 FlowTasks ready — modern task manager with auto-save & inline editing");
