import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCard } from "./TaskCard";
import { Badge } from "@/components/ui/badge";
import { startOfDay, endOfDay } from "date-fns";

interface TaskKanbanProps {
  tasks: any[];
  onEditTask: (task: any) => void;
  isGestor: boolean;
}

export function TaskKanban({ tasks, onEditTask, isGestor }: TaskKanbanProps) {
  const today = new Date();
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);

  const columns = [
    { id: "aberta", title: "Abertas", status: "aberta" },
    { id: "em_atraso", title: "Em Atraso", status: "em_atraso" },
    { id: "concluida", title: "Concluídas", status: "concluida" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((column) => {
        let columnTasks = tasks.filter((task) => {
          // Verificar se a tarefa está atrasada
          const isOverdue = task.due_date && new Date(task.due_date) < new Date();
          
          if (column.status === "aberta") {
            // Abertas: apenas tarefas do dia que não estão atrasadas
            if (!task.due_date) return task.status === "aberta";
            const dueDate = new Date(task.due_date);
            return task.status === "aberta" && dueDate >= startOfToday && dueDate <= endOfToday;
          } else if (column.status === "em_atraso") {
            // Em atraso: tarefas abertas ou em_atraso que passaram da data
            return (task.status === "aberta" || task.status === "em_atraso") && isOverdue;
          } else {
            // Concluídas
            return task.status === column.status;
          }
        });

        return (
          <Card key={column.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{column.title}</CardTitle>
                <Badge variant="secondary">{columnTasks.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {columnTasks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  Nenhuma tarefa {column.title.toLowerCase()}
                </p>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={onEditTask}
                    isGestor={isGestor}
                  />
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
