// Online C++ compiler to run C++ program online
#include <iostream>
using namespace std;

class Node
{
public:
    int data;
    Node *next;

    Node(int val)
    {
        data = val;
        next = nullptr;
    }
};

class SinglyLinkedList
{
private:
    Node *head;

public:
    void append(int val)
    {
        Node *newNode = new Node(val);
        if (!head)
        {
            head = newNode;
            return;
        }
        Node *temp = head;
        while (temp->next)
            temp = temp->next;
        temp->next = newNode;
    }

    void printSinglyList()
    {
        Node *temp = head;
        while (temp)
        {
            cout << temp->data << " ";
            temp = temp->next;
        }
        cout << endl;
    }
};


int main()
{
    // Write C++ code here
    /*
    1. Crete custom ll
    2. Add some elememetns in ll
    3. Print the ll
    4. Reverse ll
    */
    SinglyLinkedList list;
    list.append(10);
    list.append(20);
    list.append(30);

    cout << "Original List:";
    list.printSinglyList();

    return 0;
}